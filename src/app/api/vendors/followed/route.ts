import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireCustomerProfile, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Require customer profile
    const customer = await requireCustomerProfile(request);

    // 3. Find followed vendors
    const follows = await prisma.vendorFollower.findMany({
      where: { customerId: customer.id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
            isShopOpen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const followedVendors = follows.map(f => f.vendor);
    const vendorIds = followedVendors.map(v => v.id);

    // 4. Fetch latest product updates (recent items provided by followed vendors)
    let storeUpdates: any[] = [];
    if (vendorIds.length > 0) {
      const recentProducts = await prisma.product.findMany({
        where: {
          vendorId: { in: vendorIds },
          isActive: true,
          isDisabledByAdmin: false,
        },
        include: {
          vendor: {
            select: {
              businessName: true,
              logo: true,
              slug: true,
            },
          },
          images: {
            select: { url: true },
            orderBy: { position: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      storeUpdates = recentProducts.map(p => ({
        id: p.id,
        productName: p.name,
        productSlug: p.slug,
        productImage: p.images[0]?.url || null,
        price: p.price.toNumber(),
        createdAt: p.createdAt.toISOString(),
        vendor: p.vendor,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        followedVendors,
        storeUpdates,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching followed vendors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch followed vendors" },
      { status: 500 }
    );
  }
}
