/**
 * Vendor orders API
 * GET /api/vendor/orders - List orders containing vendor's items
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { getVendorOrders } from "@/lib/services/vendor-order-service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendor/orders
 * List orders containing vendor's items with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Look up vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const data = await getVendorOrders(vendorId, filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Vendor Orders API] Error fetching orders:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
