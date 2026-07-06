import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * POST /api/admin/ads-plan-payments/[id]/approve
 * Approves a bank transfer payment and activates the seller's subscription.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const payment = await prisma.adsPayment.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
            seller: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { success: false, error: `Payment is already ${payment.status}` },
        { status: 400 }
      );
    }

    const plan = payment.subscription.plan;
    const now = new Date();

    // Calculate expiry date
    let expiresAt: Date | null = null;
    if (plan.billingCycle === "MONTHLY") {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.billingCycle === "YEARLY") {
      expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    // LIFETIME => null (no expiry)

    // Cancel any existing ACTIVE subscriptions for this seller
    await prisma.adsSubscription.updateMany({
      where: {
        sellerId: payment.subscription.sellerId,
        status: "ACTIVE",
        id: { not: payment.subscription.id },
      },
      data: { status: "EXPIRED" },
    });

    // Cancel other pending or pending approval payments/subscriptions for the same seller
    const otherPendingPayments = await prisma.adsPayment.findMany({
      where: {
        subscription: {
          sellerId: payment.subscription.sellerId,
        },
        id: { not: payment.id },
        status: { in: ["PENDING", "PENDING_APPROVAL"] },
      },
    });

    if (otherPendingPayments.length > 0) {
      const otherPaymentIds = otherPendingPayments.map((p) => p.id);
      const otherSubIds = otherPendingPayments.map((p) => p.subscriptionId);

      await prisma.adsSubscription.updateMany({
        where: { id: { in: otherSubIds } },
        data: { status: "CANCELLED" },
      });

      await prisma.adsPayment.updateMany({
        where: { id: { in: otherPaymentIds } },
        data: { status: "FAILED" },
      });
    }

    // Activate subscription
    await prisma.adsSubscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
      },
    });

    // Mark payment as completed
    await prisma.adsPayment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paidAt: now,
      },
    });

    // Send in-app notification to seller
    try {
      await createNotification({
        userId: payment.subscription.seller.userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Plan Payment Approved",
        message: `Your payment for the "${plan.name}" plan has been approved and activated.`,
        link: "/ads-seller/plans",
      });
    } catch (err) {
      console.error("Error creating plan approval notification:", err);
    }

    return NextResponse.json({
      success: true,
      message: `Subscription for plan "${plan.name}" has been activated.`,
    });
  } catch (error) {
    console.error("Error approving plan payment:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to approve payment" },
      { status: 500 }
    );
  }
}
