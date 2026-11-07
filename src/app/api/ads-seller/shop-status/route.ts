import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, getEffectiveAdsSeller } from "@/lib/auth-helpers";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/shop-status
 * Returns the current shop open/closed status for the Ads Seller
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || (user.role !== "ADS_SELLER" && user.role !== "VENDOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
    const isShopOpen = sellerVendor?.vendor?.isShopOpen ?? true;

    return NextResponse.json({
      success: true,
      data: { isShopOpen },
    });
  } catch (error: any) {
    console.error("GET Ads Seller Shop Status Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/ads-seller/shop-status
 * Updates the shop open/closed status for the Ads Seller
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || (user.role !== "ADS_SELLER" && user.role !== "VENDOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isShopOpen } = body;

    if (typeof isShopOpen !== "boolean") {
      return NextResponse.json({ success: false, error: "isShopOpen must be a boolean" }, { status: 400 });
    }

    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Seller profile not found" }, { status: 404 });
    }

    // 1. Update associated vendor record
    const updatedVendor = await prisma.vendor.update({
      where: { id: sellerVendor.vendor.id },
      data: { isShopOpen },
    });

    // 2. Also sync to AdsSeller contactInfo metadata
    const effective = await getEffectiveAdsSeller(user.userId);
    const seller = effective?.seller;

    if (seller) {
      const contactInfo = (seller.contactInfo as any) || {};
      await prisma.adsSeller.update({
        where: { id: seller.id },
        data: {
          contactInfo: {
            ...contactInfo,
            isShopOpen,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { isShopOpen: updatedVendor.isShopOpen },
      message: `Shop is now ${isShopOpen ? "Open" : "Closed"}`,
    });
  } catch (error: any) {
    console.error("PATCH Ads Seller Shop Status Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update status" }, { status: 500 });
  }
}
