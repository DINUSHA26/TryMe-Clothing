import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;

    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
      include: {
        category: {
          select: { name: true, slug: true, icon: true },
        },
        subCategory: {
          include: {
            fieldDefinitions: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        seller: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!ad || ad.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Classified ad not found or inactive." },
        { status: 404 }
      );
    }

    // Increment page views in background
    try {
      await prisma.classifiedAd.update({
        where: { id: adId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    } catch (err) {
      console.error("Failed to increment ad page views:", err);
    }

    // Get seller stats (all ads count, follower count, and check follow status)
    let isFollowing = false;
    let followerCount = 0;
    let allAdsCount = 0;

    try {
      allAdsCount = await prisma.classifiedAd.count({
        where: { sellerId: ad.sellerId, status: "ACTIVE" },
      });

      followerCount = await (prisma as any).adsSellerFollower.count({
        where: { adsSellerId: ad.sellerId },
      });

      const user = getAuthUser(request);
      if (user) {
        const customer = await prisma.customer.findUnique({
          where: { userId: user.userId },
        });
        if (customer) {
          const follow = await (prisma as any).adsSellerFollower.findUnique({
            where: {
              adsSellerId_customerId: {
                adsSellerId: ad.sellerId,
                customerId: customer.id,
              },
            },
          });
          isFollowing = !!follow;
        }
      }
    } catch (err) {
      console.error("Error fetching seller follow/ads stats:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ad,
        seller: {
          ...ad.seller,
          allAdsCount,
          followerCount,
          isFollowing,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching classified ad details:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while loading ad details." },
      { status: 500 }
    );
  }
}
