/**
 * Vendor Top Products Report API
 * GET /api/vendor/reports/top-products - Product performance rankings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { topItemsFiltersSchema } from "@/lib/validations/report";

/**
 * GET /api/vendor/reports/top-products
 * Get top products by revenue or units sold
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      limit: searchParams.get("limit") || "10",
      sortBy: searchParams.get("sortBy") || "revenue",
    };

    const validation = topItemsFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, limit, sortBy } = validation.data;

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    // Build where clause
    const whereClause: any = {
      vendorId,
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
      const dateToObj = new Date(dateTo);
      dateToObj.setHours(23, 59, 59, 999);
      whereClause.order.createdAt = {
        ...whereClause.order.createdAt,
        lte: dateToObj,
      };
    }

    // Group by product
    const productStats = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: whereClause,
      _sum: {
        totalPrice: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        unitPrice: true,
      },
      orderBy:
        sortBy === "units"
          ? { _sum: { quantity: "desc" } }
          : { _sum: { totalPrice: "desc" } },
      take: limit,
    });

    // Fetch product details
    const productIds = productStats.map((stat) => stat.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Create product map
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Combine stats with product details
    const topProducts = productStats.map((stat) => {
      const product = productMap.get(stat.productId);

      return {
        productId: stat.productId,
        name: product?.name || "Unknown Product",
        unitsSold: stat._sum.quantity || 0,
        revenue: stat._sum.totalPrice?.toNumber() || 0,
        averagePrice: stat._avg.unitPrice?.toNumber() || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error("Failed to fetch top products:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top products",
      },
      { status: 500 }
    );
  }
}
