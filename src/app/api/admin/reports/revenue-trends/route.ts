/**
 * Admin Revenue Trends Report API
 * GET /api/admin/reports/revenue-trends - Time series revenue data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revenueTrendsFiltersSchema } from "@/lib/validations/report";
import { format } from "date-fns";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/reports/revenue-trends
 * Get revenue trends over time
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      period: searchParams.get("period") || "daily",
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
    };

    const validation = revenueTrendsFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { period, dateFrom, dateTo, vendorId } = validation.data;

    // Determine date truncation based on period
    const dateTrunc = period === "monthly" ? "month" : period === "weekly" ? "week" : "day";

    // Build where clause
    let whereCondition = `"status" IN ('PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED', 'PARTIALLY_SHIPPED', 'DELIVERY_CONFIRMED', 'DELIVERED', 'COMPLETED')`;

    if (dateFrom) {
      whereCondition += ` AND "createdAt" >= '${dateFrom}'::timestamp`;
    }

    if (dateTo) {
      whereCondition += ` AND "createdAt" <= '${dateTo}'::timestamp`;
    }

    // Query for revenue trends
    const query = `
      SELECT
        DATE_TRUNC('${dateTrunc}', "createdAt") as date,
        SUM("totalAmount") as revenue,
        COUNT(*) as order_count
      FROM "Order"
      WHERE ${whereCondition}
      ${vendorId ? `AND id IN (SELECT "orderId" FROM "OrderItem" WHERE "vendorId" = '${vendorId}')` : ""}
      GROUP BY DATE_TRUNC('${dateTrunc}', "createdAt")
      ORDER BY date ASC
    `;

    const trends = await prisma.$queryRawUnsafe<
      Array<{ date: Date; revenue: any; order_count: bigint }>
    >(query);

    // Query for commission trends
    const commissionQuery = `
      SELECT
        DATE_TRUNC('${dateTrunc}', wt."createdAt") as date,
        SUM(ABS(wt."amount")) as commission
      FROM "WalletTransaction" wt
      WHERE wt."type" = 'COMMISSION'
      ${dateFrom ? `AND wt."createdAt" >= '${dateFrom}'::timestamp` : ""}
      ${dateTo ? `AND wt."createdAt" <= '${dateTo}'::timestamp` : ""}
      ${vendorId ? `AND wt."walletId" IN (SELECT id FROM "Wallet" WHERE "vendorId" = '${vendorId}')` : ""}
      GROUP BY DATE_TRUNC('${dateTrunc}', wt."createdAt")
      ORDER BY date ASC
    `;

    const commissionTrends = await prisma.$queryRawUnsafe<
      Array<{ date: Date; commission: any }>
    >(commissionQuery);

    // Create a map of commission by date
    const commissionMap = new Map<string, number>();
    commissionTrends.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      commissionMap.set(dateKey, parseFloat(item.commission.toString()) || 0);
    });

    // Format labels and data
    const labels: string[] = [];
    const revenue: number[] = [];
    const commission: number[] = [];

    trends.forEach((item) => {
      const date = new Date(item.date);
      const dateKey = format(date, "yyyy-MM-dd");

      // Format label based on period
      let label: string;
      if (period === "monthly") {
        label = format(date, "MMM yyyy");
      } else if (period === "weekly") {
        label = format(date, "MMM dd");
      } else {
        label = format(date, "MMM dd");
      }

      labels.push(label);
      revenue.push(parseFloat(item.revenue.toString()) || 0);
      commission.push(commissionMap.get(dateKey) || 0);
    });

    return NextResponse.json({
      success: true,
      data: {
        labels,
        revenue,
        commission,
      },
    });
  } catch (error) {
    console.error("Failed to fetch revenue trends:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch revenue trends",
      },
      { status: 500 }
    );
  }
}
