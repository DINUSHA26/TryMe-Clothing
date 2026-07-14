import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const seller = await prisma.adsSeller.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        servicePages: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!seller || seller.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Storefront not found or suspended." },
        { status: 404 }
      );
    }

    // Get active ads from this seller
    const ads = await prisma.classifiedAd.findMany({
      where: {
        sellerId: seller.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, icon: true } },
        subCategory: { select: { name: true } },
        seller: { select: { businessName: true } },
      },
    });

    // Get follower counts and status
    let isFollowing = false;
    let followerCount = 0;

    try {
      followerCount = await (prisma as any).adsSellerFollower.count({
        where: { adsSellerId: seller.id },
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
                adsSellerId: seller.id,
                customerId: customer.id,
              },
            },
          });
          isFollowing = !!follow;
        }
      }
    } catch (err) {
      console.error("Error fetching seller follower stats:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        seller: {
          ...seller,
          followerCount,
          isFollowing,
        },
        servicePages: seller.servicePages,
        ads,
      },
    });
  } catch (error) {
    console.error("Error loading seller storefront data:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while loading storefront details." },
      { status: 500 }
    );
  }
}
