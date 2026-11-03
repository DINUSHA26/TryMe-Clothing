/**
 * Ads Seller order details API
 * GET /api/ads-seller/orders/[orderId] - Get single order details for ads seller
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { getVendorOrderDetail } from "@/lib/services/vendor-order-service";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/orders/[orderId]
 * Returns order details scoped to this ads seller's items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json(
        { success: false, error: "Ads seller not found" },
        { status: 404 }
      );
    }
    const vendorId = sellerVendor.vendor.id;

    const { orderId } = await params;
    const data = await getVendorOrderDetail(vendorId, orderId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Ads Seller Order Detail API] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order details" },
      { status: error.message === "Order not found" ? 404 : 500 }
    );
  }
}

