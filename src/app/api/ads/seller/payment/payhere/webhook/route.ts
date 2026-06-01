import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, parseStatusCode } from "@/lib/payhere";
import { payhereWebhookSchema } from "@/lib/validations/payment";

/**
 * POST /api/ads/seller/payment/payhere/webhook
 * Handles PayHere notifications for ads plan subscriptions.
 * CRITICAL: This endpoint must ALWAYS return 200 to prevent PayHere from retrying.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract form data from request (PayHere sends URL-encoded form data)
    const formData = await request.formData();
    const payload: Record<string, string> = {};

    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    console.log("[PayHere Ads Webhook] Received notification:", {
      order_id: payload.order_id,
      payment_id: payload.payment_id,
      status_code: payload.status_code,
      amount: payload.payhere_amount,
    });

    // Validate payload
    const validation = payhereWebhookSchema.safeParse(payload);
    if (!validation.success) {
      console.error("[PayHere Ads Webhook] Validation failed:", validation.error.issues);
      return NextResponse.json({ success: true }); // Return 200 OK to prevent retries
    }

    const webhookData = validation.data;

    // Get merchant secret
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) {
      console.error("[PayHere Ads Webhook] Merchant secret not configured");
      return NextResponse.json({ success: true });
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      {
        merchant_id: webhookData.merchant_id,
        order_id: webhookData.order_id,
        payhere_amount: webhookData.payhere_amount,
        payhere_currency: webhookData.payhere_currency,
        status_code: webhookData.status_code,
        md5sig: webhookData.md5sig,
      },
      merchantSecret
    );

    if (!isValidSignature) {
      console.error("[PayHere Ads Webhook] INVALID SIGNATURE - Possible fraud attempt:", {
        order_id: webhookData.order_id,
        payment_id: webhookData.payment_id,
      });
      return NextResponse.json({ success: true });
    }

    console.log("[PayHere Ads Webhook] Signature verified successfully");

    // Find subscription by id (order_id in PayHere)
    const subscription = await prisma.adsSubscription.findUnique({
      where: { id: webhookData.order_id },
      include: {
        payment: true,
        plan: true,
      },
    });

    if (!subscription) {
      console.error("[PayHere Ads Webhook] Subscription not found:", webhookData.order_id);
      return NextResponse.json({ success: true });
    }

    // Idempotency check: If payment already processed, return success
    if (subscription.payment && subscription.payment.status !== "PENDING") {
      console.log("[PayHere Ads Webhook] Payment already processed (idempotent):", {
        order_id: webhookData.order_id,
        payment_id: webhookData.payment_id,
        existing_status: subscription.payment.status,
      });
      return NextResponse.json({ success: true });
    }

    // Parse status code
    const { status: paymentStatus, message: statusMessage } = parseStatusCode(
      webhookData.status_code
    );

    console.log("[PayHere Ads Webhook] Status:", paymentStatus, "-", statusMessage);

    // Perform atomic transaction to update subscription and payment status
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      if (paymentStatus === "COMPLETED") {
        // Calculate expiry date
        let expiresAt: Date | null = null;
        if (subscription.plan.billingCycle === "MONTHLY") {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (subscription.plan.billingCycle === "YEARLY") {
          expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // Cancel/Expire any other ACTIVE subscriptions for this seller
        await tx.adsSubscription.updateMany({
          where: {
            sellerId: subscription.sellerId,
            status: "ACTIVE",
            id: { not: subscription.id },
          },
          data: { status: "EXPIRED" },
        });

        // Cancel other pending or pending approval payments/subscriptions for the same seller
        const otherPendingPayments = await tx.adsPayment.findMany({
          where: {
            subscription: {
              sellerId: subscription.sellerId,
            },
            id: { not: subscription.payment?.id },
            status: { in: ["PENDING", "PENDING_APPROVAL"] },
          },
        });

        if (otherPendingPayments.length > 0) {
          const otherPaymentIds = otherPendingPayments.map((p) => p.id);
          const otherSubIds = otherPendingPayments.map((p) => p.subscriptionId);

          await tx.adsSubscription.updateMany({
            where: { id: { in: otherSubIds } },
            data: { status: "CANCELLED" },
          });

          await tx.adsPayment.updateMany({
            where: { id: { in: otherPaymentIds } },
            data: { status: "FAILED" },
          });
        }

        // Activate this subscription
        await tx.adsSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            startsAt: now,
            expiresAt,
          },
        });

        // Update AdsPayment
        if (subscription.payment) {
          await tx.adsPayment.update({
            where: { id: subscription.payment.id },
            data: {
              payherePaymentId: webhookData.payment_id,
              status: "COMPLETED",
              paymentMethod: webhookData.method || "PAYHERE",
              paidAt: now,
              paymentHash: webhookData.md5sig,
              notificationData: payload,
            },
          });
        }
      } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
        // Cancel subscription
        await tx.adsSubscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELLED" },
        });

        // Update payment status
        if (subscription.payment) {
          await tx.adsPayment.update({
            where: { id: subscription.payment.id },
            data: {
              status: "FAILED",
              payherePaymentId: webhookData.payment_id,
              paymentMethod: webhookData.method || "PAYHERE",
              paymentHash: webhookData.md5sig,
              notificationData: payload,
            },
          });
        }
      }
    });

    console.log("[PayHere Ads Webhook] Webhook processing completed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PayHere Ads Webhook] Error processing webhook:", error);
    // ALWAYS return 200 to prevent PayHere retries
    return NextResponse.json({ success: true });
  }
}
