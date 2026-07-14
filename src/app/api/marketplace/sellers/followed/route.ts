import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireCustomerProfile, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view followed sellers" },
        { status: 401 }
      );
    }

    // 2. Require customer profile
    const customer = await requireCustomerProfile(request);

    // 3. Find followed ads sellers
    const follows = await (prisma as any).adsSellerFollower.findMany({
      where: { customerId: customer.id },
      include: {
        adsSeller: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactInfo: true,
            phone: true,
            primaryCategory: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const followedSellers = follows.map((f: any) => f.adsSeller);
    const sellerIds = followedSellers.map((s: any) => s.id);

    // 4. Fetch latest classified ad updates from followed sellers
    let adsUpdates: any[] = [];
    if (sellerIds.length > 0) {
      adsUpdates = await prisma.classifiedAd.findMany({
        where: {
          sellerId: { in: sellerIds },
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          seller: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              contactInfo: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        followedSellers,
        adsUpdates,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching followed ads sellers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch followed ads sellers" },
      { status: 500 }
    );
  }
}
