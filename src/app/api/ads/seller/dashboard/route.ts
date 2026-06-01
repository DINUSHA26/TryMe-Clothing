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
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    // Get statistics
    const activeAdsCount = await prisma.classifiedAd.count({
      where: {
        sellerId: seller.id,
        status: "ACTIVE",
      },
    });

    const pendingAdsCount = await prisma.classifiedAd.count({
      where: {
        sellerId: seller.id,
        status: "PENDING",
      },
    });

    // Sum views
    const adsViewsAgg = await prisma.classifiedAd.aggregate({
      where: {
        sellerId: seller.id,
      },
      _sum: {
        views: true,
      },
    });

    const totalViews = adsViewsAgg._sum.views || 0;

    // Get active subscription info
    const activeSubscription = seller.subscriptions[0];
    const planName = activeSubscription?.plan?.name || "Free Plan";
    const adsUsed = activeSubscription?.adsUsed || 0;
    const maxAds = activeSubscription?.plan?.maxAds || 3;

    // Get recent ads (last 5)
    const recentAds = await prisma.classifiedAd.findMany({
      where: {
        sellerId: seller.id,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        subCategory: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          activeAdsCount,
          pendingAdsCount,
          totalViews,
          planName,
          adsUsed,
          maxAds,
        },
        recentAds,
      },
    });
  } catch (error) {
    console.error("Error loading seller dashboard statistics:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while loading dashboard statistics" },
      { status: 500 }
    );
  }
}
