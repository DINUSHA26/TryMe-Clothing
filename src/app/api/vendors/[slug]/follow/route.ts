import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireCustomerProfile, handleAuthError, AuthError } from "@/lib/auth-helpers";

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
        { success: false, error: "Authentication required to follow a shop" },
        { status: 401 }
      );
    }

    // 2. Require customer profile
    const customer = await requireCustomerProfile(request);

    // 3. Find the vendor
    const vendor = await prisma.vendor.findUnique({
      where: { slug },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // 4. Toggle follow state
    const existingFollow = await prisma.vendorFollower.findUnique({
      where: {
        vendorId_customerId: {
          vendorId: vendor.id,
          customerId: customer.id,
        },
      },
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await prisma.vendorFollower.delete({
        where: {
          vendorId_customerId: {
            vendorId: vendor.id,
            customerId: customer.id,
          },
        },
      });
      isFollowing = false;
    } else {
      // Follow
      await prisma.vendorFollower.create({
        data: {
          vendorId: vendor.id,
          customerId: customer.id,
        },
      });
      isFollowing = true;
    }

    // 5. Get updated follower count
    const followerCount = await prisma.vendorFollower.count({
      where: { vendorId: vendor.id },
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

    console.error("Error toggling follow vendor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update follow status" },
      { status: 500 }
    );
  }
}
