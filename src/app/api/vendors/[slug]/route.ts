import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: {
        slug,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
        websiteConfig: {
          where: { isPublished: true },
          include: {
            pages: {
              where: { isPublished: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        customDomain: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDisabledByAdmin: false,
              },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    if (!vendor.user.isActive) {
      return NextResponse.json(
        { success: false, error: "Vendor is not available" },
        { status: 404 }
      );
    }

    // Optimized: Execute follower count, total sells, rating aggregation, and customer check concurrently in parallel
    const user = getAuthUser(request);
    const [followerCount, totalSellsSum, avgRatingAgg, customer] = await Promise.all([
      // 1. Follower count
      prisma.vendorFollower.count({
        where: { vendorId: vendor.id },
      }),

      // 2. Total items sold
      prisma.orderItem.aggregate({
        where: {
          vendorId: vendor.id,
          status: {
            notIn: ["PENDING_PAYMENT", "PENDING_VERIFICATION", "CANCELLED"],
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // 3. Rating
      prisma.productReview.aggregate({
        where: {
          product: {
            vendorId: vendor.id,
          },
          isVisible: true,
        },
        _avg: {
          rating: true,
        },
      }),

      // 4. Customer lookup (if authenticated)
      user
        ? prisma.customer.findUnique({
            where: { userId: user.userId },
          })
        : Promise.resolve(null),
    ]);

    const totalSells = totalSellsSum._sum.quantity || 0;
    const rating = avgRatingAgg._avg.rating ? Math.round(avgRatingAgg._avg.rating * 10) / 10 : 0;

    // 5. Check if following
    let isFollowing = false;
    if (customer) {
      const follow = await prisma.vendorFollower.findUnique({
        where: {
          vendorId_customerId: {
            vendorId: vendor.id,
            customerId: customer.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          businessName: vendor.businessName,
          slug: vendor.slug,
          description: vendor.description,
          logo: vendor.logo,
          banner: vendor.banner,
          shopOpen: vendor.isShopOpen,
          productCount: vendor._count.products,
          followerCount,
          totalSells,
          rating,
          isFollowing,
          websiteConfig: (vendor as any).websiteConfig || null,
          customDomain: (vendor as any).customDomain?.domain || null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

