/**
 * Admin Order Distribution Report API
 * GET /api/admin/reports/order-distribution - Order status breakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderDistributionFiltersSchema } from "@/lib/validations/report";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/reports/order-distribution
 * Get order count by status
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
    };

    const validation = orderDistributionFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, vendorId } = validation.data;

    // Build where clause
    const whereClause: any = {};

    if (dateFrom) {
      whereClause.createdAt = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(dateTo),
      };
    }

    if (vendorId) {
      whereClause.items = {
        some: {
          vendorId: vendorId,
        },
      };
    }

    // Group orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Convert to object format { STATUS: count }
    const distribution: Record<string, number> = {};

    ordersByStatus.forEach((item) => {
      distribution[item.status] = item._count.id;
    });

    // Ensure all statuses are present (even with 0 count)
    const allStatuses = [
      "PENDING_PAYMENT",
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "PARTIALLY_SHIPPED",
      "DELIVERY_CONFIRMED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
      "REFUNDED",
    ];

    allStatuses.forEach((status) => {
      if (!(status in distribution)) {
        distribution[status] = 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Failed to fetch order distribution:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch order distribution",
      },
      { status: 500 }
    );
  }
}
