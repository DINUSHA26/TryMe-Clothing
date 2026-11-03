/**
 * Ads Seller orders API
 * GET /api/ads-seller/orders - List orders containing ads seller's items
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { getVendorOrders } from "@/lib/services/vendor-order-service";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/orders
 * List orders containing ads seller's items with pagination and filtering
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      status: searchParams.get("status") || undefined,
      source: (searchParams.get("source") as any) || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const data = await getVendorOrders(vendorId, filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Ads Seller Orders API] Error fetching orders:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
