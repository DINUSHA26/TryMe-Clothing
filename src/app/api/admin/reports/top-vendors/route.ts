/**
 * Admin Top Vendors Report API
 * GET /api/admin/reports/top-vendors - Vendor performance rankings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { topItemsFiltersSchema } from "@/lib/validations/report";



/**
 * GET /api/admin/reports/top-vendors
 * Get top vendors by revenue
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
      limit: searchParams.get("limit") || "10",
    };

    const validation = topItemsFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, limit } = validation.data;

    // Build where clause for order items
    const whereClause: any = {
      order: {
        status: {
          in: [
            "PAYMENT_CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "PARTIALLY_SHIPPED",
            "DELIVERY_CONFIRMED",
            "DELIVERED",
            "COMPLETED",
          ],
        },
      },
    };

    if (dateFrom) {
      whereClause.order.createdAt = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      whereClause.order.createdAt = {
        ...whereClause.order.createdAt,
        lte: new Date(dateTo),
      };
    }

    // Group order items by vendor
    const vendorStats = await prisma.orderItem.groupBy({
      by: ["vendorId"],
      where: whereClause,
      _sum: {
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
      take: limit,
    });

    // Fetch vendor details
    const vendorIds = vendorStats.map((stat) => stat.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: {
        id: {
          in: vendorIds,
        },
      },
      select: {
        id: true,
        businessName: true,
        status: true,
      },
    });

    // Create vendor map for quick lookup
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    // Combine stats with vendor details
    const topVendors = vendorStats.map((stat) => {
      const vendor = vendorMap.get(stat.vendorId);
      const totalRevenue = stat._sum.totalPrice?.toNumber() || 0;
      const orderCount = stat._count.id;

      return {
        vendorId: stat.vendorId,
        businessName: vendor?.businessName || "Unknown",
        totalRevenue,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: topVendors,
    });
  } catch (error) {
    console.error("Failed to fetch top vendors:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top vendors",
      },
      { status: 500 }
    );
  }
}
