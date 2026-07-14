import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireCustomerProfile, handleAuthError } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to follow a seller" },
        { status: 401 }
      );
    }

    // 2. Require customer profile
    const customer = await requireCustomerProfile(request);

    // 3. Find the ads seller
    const adsSeller = await prisma.adsSeller.findUnique({
      where: { slug },
    });

    if (!adsSeller) {
      return NextResponse.json(
        { success: false, error: "Seller not found" },
        { status: 404 }
      );
    }

    // 4. Toggle follow state
    const existingFollow = await (prisma as any).adsSellerFollower.findUnique({
      where: {
        adsSellerId_customerId: {
          adsSellerId: adsSeller.id,
          customerId: customer.id,
        },
      },
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await (prisma as any).adsSellerFollower.delete({
        where: {
          adsSellerId_customerId: {
            adsSellerId: adsSeller.id,
            customerId: customer.id,
          },
        },
      });
      isFollowing = false;
    } else {
      // Follow
      await (prisma as any).adsSellerFollower.create({
        data: {
          adsSellerId: adsSeller.id,
          customerId: customer.id,
        },
      });
      isFollowing = true;
    }

    // 5. Get updated follower count
    const followerCount = await (prisma as any).adsSellerFollower.count({
      where: { adsSellerId: adsSeller.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        isFollowing,
        followerCount,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error toggling follow ads seller:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update follow status" },
      { status: 500 }
    );
  }
}
