/**
 * Customer orders API
 * GET /api/orders - List customer's orders with pagination and filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { requireCustomerProfile, handleAuthError } from "@/lib/auth-helpers";
import { getCustomerOrders } from "@/lib/services/order-service";
import { orderFiltersSchema } from "@/lib/validations/order";

/**
 * GET /api/orders
 * List customer's orders with pagination, filtering, and stats
 */
export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomerProfile(request);
    const customerId = customer.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const data = await getCustomerOrders(customerId, filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Orders API] Error fetching orders:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
