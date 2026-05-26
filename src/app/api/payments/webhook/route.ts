/**
 * PayHere webhook handler API
 * POST /api/payments/webhook - Process PayHere payment notifications
 *
 * CRITICAL: This endpoint must ALWAYS return 200 to prevent PayHere from retrying
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payhereWebhookSchema } from "@/lib/validations/payment";
import { verifyWebhookSignature, parseStatusCode } from "@/lib/payhere";
import { calculateVendorEarnings, creditVendorWallets } from "@/lib/utils/wallet";
import { createChatRoomsForOrder } from "@/lib/chat/roomManager";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * POST /api/payments/webhook
 * Process PayHere payment notification
 */
export async function POST(request: NextRequest) {
  try {
    // Extract form data from request (PayHere sends URL-encoded form data)
    const formData = await request.formData();
    const payload: Record<string, string> = {};

    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    console.log("[PayHere Webhook] Received notification:", {
      order_id: payload.order_id,
      payment_id: payload.payment_id,
      status_code: payload.status_code,
      amount: payload.payhere_amount,
    });

    // Validate payload
    const validation = payhereWebhookSchema.safeParse(payload);

    if (!validation.success) {
      console.error("[PayHere Webhook] Validation failed:", validation.error.issues);
      return NextResponse.json({ success: true }); // Return 200 even on validation error
    }

    const webhookData = validation.data;

    // Get merchant secret for signature verification
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      console.error("[PayHere Webhook] Merchant secret not configured");
      return NextResponse.json({ success: true }); // Return 200
    }

    // CRITICAL: Verify webhook signature
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
      console.error("[PayHere Webhook] INVALID SIGNATURE - Possible fraud attempt:", {
        order_id: webhookData.order_id,
        payment_id: webhookData.payment_id,
      });
      return NextResponse.json({ success: true }); // Return 200 but don't process
    }

    console.log("[PayHere Webhook] Signature verified successfully");

    // Find order by order number
    const order = await prisma.order.findUnique({
      where: { orderNumber: webhookData.order_id },
      include: {
        payment: true,
        customer: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
        coupon: {
          select: {
            vendorId: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                commissionRate: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.error("[PayHere Webhook] Order not found:", webhookData.order_id);
      return NextResponse.json({ success: true }); // Return 200
    }

    // Idempotency check: If payment already processed, return success
    if (order.payment && order.payment.status !== "PENDING") {
      console.log("[PayHere Webhook] Payment already processed (idempotent):", {
        order_id: webhookData.order_id,
        payment_id: webhookData.payment_id,
        existing_status: order.payment.status,
      });
      return NextResponse.json({ success: true });
    }

    // Parse status code
    const { status: paymentStatus, message: statusMessage } = parseStatusCode(
      webhookData.status_code
    );

    console.log("[PayHere Webhook] Status:", paymentStatus, "-", statusMessage);

    // Perform atomic transaction
    await prisma.$transaction(
      async (tx) => {
        const prismaPaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" =
          paymentStatus === "COMPLETED"
            ? "COMPLETED"
            : paymentStatus === "PENDING"
            ? "PENDING"
            : "FAILED";

        // Update or create Payment record
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              payherePaymentId: webhookData.payment_id,
              status: prismaPaymentStatus,
              paymentMethod: webhookData.method || null,
              paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
              paymentHash: webhookData.md5sig,
              notificationData: payload,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              payherePaymentId: webhookData.payment_id,
              amount: order.totalAmount,
              currency: "LKR",
              status: prismaPaymentStatus,
              paymentMethod: webhookData.method || null,
              paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
              paymentHash: webhookData.md5sig,
              notificationData: payload,
            },
          });
        }

        // Update order status based on payment status
        let newOrderStatus = order.status;

        if (paymentStatus === "COMPLETED") {
          newOrderStatus = "PAYMENT_CONFIRMED";
        } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
          newOrderStatus = "CANCELLED";
        }

        // Only update if status changed
        if (newOrderStatus !== order.status) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: newOrderStatus },
          });

          // Create order status history
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: newOrderStatus,
              note: `Payment ${paymentStatus.toLowerCase()}: ${statusMessage}`,
              createdBy: null, // System action
            },
          });

          // If payment failed/cancelled, restore stock
          if (newOrderStatus === "CANCELLED") {
            for (const item of order.items) {
              if (item.variantId) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: {
                    stock: { increment: item.quantity },
                  },
                });
              } else {
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    stock: { increment: item.quantity },
                  },
                });
              }
            }
          }

          console.log("[PayHere Webhook] Order status updated:", {
            order_id: order.orderNumber,
            old_status: order.status,
            new_status: newOrderStatus,
          });

          // (Post-transaction side effects handled after the transaction below)
        }

        // If payment successful, credit vendor wallets
        if (paymentStatus === "COMPLETED") {
          console.log("[PayHere Webhook] Processing wallet credits...");

          // Calculate vendor earnings
          const vendorEarnings = calculateVendorEarnings(
            order.items,
            order.discountAmount,
            order.coupon?.vendorId
          );

          console.log("[PayHere Webhook] Vendor earnings calculated:", {
            vendor_count: vendorEarnings.length,
            total_platform_commission: vendorEarnings
              .reduce((sum, e) => sum.add(e.commissionAmount), new Decimal(0))
              .toFixed(2),
          });

          // Credit vendor wallets
          await creditVendorWallets(
            vendorEarnings,
            order.id,
            order.orderNumber,
            tx
          );

          console.log("[PayHere Webhook] Vendor wallets credited successfully");
        }
      },
      {
        timeout: 30000, // 30 second timeout for long transactions
      }
    );

    // Post-transaction side effects for PAYMENT_CONFIRMED
    if (paymentStatus === "COMPLETED" && order.status === "PENDING_PAYMENT") {
      // Create chat rooms (after transaction commits so order status is PAYMENT_CONFIRMED)
      try {
        console.log("[PayHere Webhook] Creating chat rooms for order:", order.id);
        await createChatRoomsForOrder(order.id);
        console.log("[PayHere Webhook] Chat rooms created successfully");
      } catch (chatError) {
        console.error("[PayHere Webhook] Failed to create chat rooms:", chatError);
      }

      // Send notification to customer
      try {
        await createNotification({
          userId: order.customer.user.id,
          type: NotificationType.ORDER_PAYMENT_CONFIRMED,
          title: "Payment Confirmed",
          message: `Your payment for order ${order.orderNumber} has been processed successfully.`,
          link: `/orders/${order.id}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount.toNumber(),
          },
        });
      } catch (notifError) {
        console.error("[PayHere Webhook] Failed to send notification:", notifError);
      }
    }

    console.log("[PayHere Webhook] Processing completed successfully:", {
      order_id: webhookData.order_id,
      payment_id: webhookData.payment_id,
      status: paymentStatus,
    });

    // ALWAYS return 200 to PayHere
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PayHere Webhook] Error processing webhook:", error);

    // ALWAYS return 200 even on error to prevent infinite retries
    return NextResponse.json({ success: true });
  }
}

// Need to import Decimal
import { Decimal } from "@prisma/client/runtime/library";
