/**
 * Admin Revenue by Category Report API
 * GET /api/admin/reports/revenue-by-category - Category performance rankings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { topItemsFiltersSchema } from "@/lib/validations/report";



/**
 * GET /api/admin/reports/revenue-by-category
 * Get top categories by revenue
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

    // Get order items with product and category info
    const orderItems = await prisma.orderItem.findMany({
      where: whereClause,
      select: {
        totalPrice: true,
        productSnapshot: true,
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { name: string; totalRevenue: number; orderCount: number }
    >();

    orderItems.forEach((item) => {
      const snapshot = item.productSnapshot as any;
      const categoryId = snapshot?.categoryId;
      const categoryName = snapshot?.categoryName || "Uncategorized";

      if (categoryId) {
        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.totalRevenue += item.totalPrice.toNumber();
          existing.orderCount += 1;
        } else {
          categoryMap.set(categoryId, {
            name: categoryName,
            totalRevenue: item.totalPrice.toNumber(),
            orderCount: 1,
          });
        }
      }
    });

    // Convert to array and sort by revenue
    const topCategories = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        name: data.name,
        totalRevenue: data.totalRevenue,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: topCategories,
    });
  } catch (error) {
    console.error("Failed to fetch revenue by category:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch revenue by category",
      },
      { status: 500 }
    );
  }
}
