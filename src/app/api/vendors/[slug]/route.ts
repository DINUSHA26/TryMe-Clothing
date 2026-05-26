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

    // 1. Fetch updated follower count
    const followerCount = await prisma.vendorFollower.count({
      where: { vendorId: vendor.id },
    });

    // 2. Fetch total items sold (quantity sold in completed/paid orders)
    const totalSellsSum = await prisma.orderItem.aggregate({
      where: {
        vendorId: vendor.id,
        status: {
          notIn: ["PENDING_PAYMENT", "PENDING_VERIFICATION", "CANCELLED"],
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const totalSells = totalSellsSum._sum.quantity || 0;

    // 3. Fetch rating (calculate by reviews that vendor sold items)
    const avgRatingAgg = await prisma.productReview.aggregate({
      where: {
        product: {
          vendorId: vendor.id,
        },
        isVisible: true,
      },
      _avg: {
        rating: true,
      },
    });
    const rating = avgRatingAgg._avg.rating ? Math.round(avgRatingAgg._avg.rating * 10) / 10 : 0;

    // 4. Check if the logged-in user is currently following this shop
    let isFollowing = false;
    const user = getAuthUser(request);
    if (user) {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });
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

