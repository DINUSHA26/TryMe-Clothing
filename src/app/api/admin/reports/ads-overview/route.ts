import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { AdsPlanType } from "@prisma/client";

/**
 * GET /api/admin/reports/ads-overview
 * Retrieves dashboard statistics for marketplace classified ads
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // 1. Total revenue from completed ads plan payments
    const paymentsSummary = await prisma.adsPayment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    });
    const totalRevenue = Number(paymentsSummary._sum.amount || 0);
    const totalPaymentsCount = paymentsSummary._count;

    // 2. Active subscriptions count
    const activeSubscriptionsCount = await prisma.adsSubscription.count({
      where: { status: "ACTIVE" },
    });

    // 3. Active subscription counts split by plan type
    const activeSubscribtionPlans = await prisma.adsSubscription.findMany({
      where: { status: "ACTIVE" },
      select: {
        plan: {
          select: {
            type: true,
          },
        },
      },
    });

    const activePlansDistribution = {
      FREE: 0,
      BASIC: 0,
      PRO: 0,
      PREMIUM: 0,
    };

    activeSubscribtionPlans.forEach((sub) => {
      if (sub.plan?.type) {
        activePlansDistribution[sub.plan.type as AdsPlanType]++;
      }
    });

    // 4. Revenue split by plan type
    const completedPayments = await prisma.adsPayment.findMany({
      where: { status: "COMPLETED" },
      select: {
        amount: true,
        subscription: {
          select: {
            plan: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    const revenueByPlanType = {
      FREE: 0,
      BASIC: 0,
      PRO: 0,
      PREMIUM: 0,
    };

    completedPayments.forEach((payment) => {
      if (payment.subscription?.plan?.type) {
        revenueByPlanType[payment.subscription.plan.type as AdsPlanType] += Number(payment.amount);
      }
    });

    // 5. General classified ads statistics
    const totalClassifiedAds = await prisma.classifiedAd.count();
    const activeClassifiedAds = await prisma.classifiedAd.count({
      where: { status: "ACTIVE" },
    });
    const pendingClassifiedAds = await prisma.classifiedAd.count({
      where: { status: "PENDING" },
    });

    // 6. General seller statistics
    const totalSellers = await prisma.adsSeller.count();
    const activeSellers = await prisma.adsSeller.count({
      where: { status: "ACTIVE" },
    });

    // 7. Total interaction metrics (views)
    const viewsSummary = await prisma.classifiedAd.aggregate({
      _sum: { views: true },
    });
    const totalAdsViews = Number(viewsSummary._sum.views || 0);

    // 8. Recent payments
    const recentPaymentsRaw = await prisma.adsPayment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          select: {
            seller: {
              select: {
                businessName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            plan: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const recentPayments = recentPaymentsRaw.map((payment) => {
      const seller = payment.subscription.seller;
      const sellerName = seller?.businessName || 
        `${seller?.user?.firstName || ""} ${seller?.user?.lastName || ""}`.trim() || 
        seller?.user?.email || "Unknown Seller";

      return {
        id: payment.id,
        amount: Number(payment.amount),
        status: payment.status,
        createdAt: payment.createdAt,
        planName: payment.subscription.plan.name,
        planType: payment.subscription.plan.type,
        sellerName,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalPaymentsCount,
        activeSubscriptionsCount,
        activePlansDistribution,
        revenueByPlanType,
        totalClassifiedAds,
        activeClassifiedAds,
        pendingClassifiedAds,
        totalSellers,
        activeSellers,
        totalAdsViews,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("[Ads Overview API] Failed to fetch stats:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ads overview statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
