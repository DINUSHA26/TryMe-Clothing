/**
 * Admin orders API
 * GET /api/admin/orders - List all orders with advanced filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getAdminOrders } from "@/lib/services/admin-order-service";

/**
 * GET /api/admin/orders
 * List all orders with advanced filtering (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      minAmount: searchParams.get("minAmount") || undefined,
      maxAmount: searchParams.get("maxAmount") || undefined,
    };

    const data = await getAdminOrders(filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Admin Orders API] Error fetching orders:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
