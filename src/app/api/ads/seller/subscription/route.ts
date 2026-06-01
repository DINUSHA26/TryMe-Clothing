import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            plan: true,
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

    const activeSubscription = seller.subscriptions[0];
    const planName = activeSubscription?.plan?.name || "Free Plan";
    const maxAds = activeSubscription?.plan?.maxAds || 3;
    const adsUsed = activeSubscription?.adsUsed || 0;
    const planId = activeSubscription?.planId || null;
    const status = activeSubscription?.status || null;
    const expiresAt = activeSubscription?.expiresAt || null;

    return NextResponse.json({
      success: true,
      data: {
        planName,
        maxAds,
        adsUsed,
        planId,
        status,
        expiresAt,
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
