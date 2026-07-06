import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * POST /api/admin/ads-plan-payments/[id]/reject
 * Rejects a bank transfer payment and cancels the pending subscription.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Payment rejected by admin.";

    const payment = await prisma.adsPayment.findUnique({
      where: { id },
      include: { subscription: { include: { plan: true, seller: true } } },
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

    // Cancel subscription
    await prisma.adsSubscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "CANCELLED" },
    });

    // Mark payment as rejected
    await prisma.adsPayment.update({
      where: { id: payment.id },
      data: {
        status: "REJECTED",
        notificationData: { reason },
      },
    });

    // Send in-app notification to seller
    try {
      await createNotification({
        userId: payment.subscription.seller.userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Plan Payment Rejected",
        message: `Your payment for the "${payment.subscription.plan.name}" plan has been rejected. Reason: ${reason}`,
        link: "/ads-seller/plans",
      });
    } catch (err) {
      console.error("Error creating plan rejection notification:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Payment has been rejected and subscription cancelled.",
    });
  } catch (error) {
    console.error("Error rejecting plan payment:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to reject payment" },
      { status: 500 }
    );
  }
}
