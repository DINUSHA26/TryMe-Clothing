import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile with recent subscriptions
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            plan: true,
            payment: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const activeSubscription = seller.subscriptions.find((sub) => sub.status === "ACTIVE");
    const pendingSubscription = seller.subscriptions.find((sub) => sub.status === "PENDING_APPROVAL");
    const rejectedSubscription = seller.subscriptions.find((sub) => sub.payment?.status === "REJECTED");

    // Only return pendingSub if it is newer than active subscription (if active subscription exists)
    let pendingSubData = null;
    if (pendingSubscription) {
      const isNewerThanActive = !activeSubscription || pendingSubscription.createdAt > activeSubscription.createdAt;
      if (isNewerThanActive) {
        pendingSubData = {
          planName: pendingSubscription.plan.name,
          amount: pendingSubscription.payment?.amount,
          submittedAt: pendingSubscription.createdAt,
        };
      }
    }

    // Only return rejectedSub if it is the most recent attempt
    let rejectedSubData = null;
    if (rejectedSubscription) {
      const isNewerThanActive = !activeSubscription || rejectedSubscription.createdAt > activeSubscription.createdAt;
      const isNewerThanPending = !pendingSubscription || rejectedSubscription.createdAt > pendingSubscription.createdAt;
      if (isNewerThanActive && isNewerThanPending) {
        rejectedSubData = {
          planName: rejectedSubscription.plan.name,
          amount: rejectedSubscription.payment?.amount,
          reason: (rejectedSubscription.payment?.notificationData as any)?.reason || "Payment rejected by admin.",
          rejectedAt: rejectedSubscription.payment?.updatedAt,
        };
      }
    }

    const planName = activeSubscription?.plan?.name || "Free Plan";
    const maxAds = activeSubscription?.plan?.maxAds || 3;
    const adsUsed = activeSubscription?.adsUsed || 0;
    const planId = activeSubscription?.planId || null;
    let status = activeSubscription?.status || null;
    const expiresAt = activeSubscription?.expiresAt || null;

    if (expiresAt && new Date() > new Date(expiresAt)) {
      status = "EXPIRED";
    }

    return NextResponse.json({
      success: true,
      data: {
        planName,
        maxAds,
        adsUsed,
        planId,
        status,
        expiresAt,
        pendingSub: pendingSubData,
        rejectedSub: rejectedSubData,
      },
    });
  } catch (error) {
    console.error("Error fetching seller subscription:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching subscription" },
      { status: 500 }
    );
  }
}
