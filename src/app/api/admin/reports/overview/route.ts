/**
 * Admin Overview Report API
 * GET /api/admin/reports/overview - Dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/reports/overview
 * Get dashboard statistics for admin
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

    const validation = adminOverviewFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, vendorId } = validation.data;

    // Define valid statuses for revenue
    const validStatuses = [
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "PARTIALLY_SHIPPED",
      "DELIVERED",
      "DELIVERY_CONFIRMED",
      "COMPLETED",
    ];

    // Build dynamic WHERE clause for raw SQL
    let whereClause = `WHERE o."status" IN (${validStatuses.map(s => `'${s}'::"OrderStatus"`).join(', ')})`;
    const queryParamsRaw: any[] = [];

    if (dateFrom) {
      queryParamsRaw.push(new Date(dateFrom));
      whereClause += ` AND o."createdAt" >= $${queryParamsRaw.length}`;
    }

    if (dateTo) {
      queryParamsRaw.push(new Date(dateTo));
      whereClause += ` AND o."createdAt" <= $${queryParamsRaw.length}`;
    }

    if (vendorId) {
      queryParamsRaw.push(vendorId);
      whereClause += ` AND o."id" IN (SELECT "orderId" FROM "OrderItem" WHERE "vendorId" = $${queryParamsRaw.length})`;
    }

    // Calculate total revenue, count, and average
    const revenueResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM("totalAmount"), 0)::float as "totalRevenue",
        COUNT(*)::int as "totalOrders",
        COALESCE(AVG("totalAmount"), 0)::float as "averageOrderValue"
       FROM "Order" o
       ${whereClause}`,
      ...queryParamsRaw
    );

    const { totalRevenue, totalOrders, averageOrderValue } = revenueResult[0];

    // Calculate this month's revenue
    const thisMonthStart = startOfMonth(new Date());
    const monthParams = [...queryParamsRaw, thisMonthStart];
    const monthWhere = whereClause + ` AND o."createdAt" >= $${monthParams.length}`;
    
    const thisMonthResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM("totalAmount"), 0)::float as "thisMonthRevenue" FROM "Order" o ${monthWhere}`,
      ...monthParams
    );

    const thisMonthRevenue = thisMonthResult[0].thisMonthRevenue;

    // Calculate total commission
    let commissionWhere = `WHERE t."type" = 'COMMISSION'`;
    const commissionParams: any[] = [];

    if (dateFrom) {
      commissionParams.push(new Date(dateFrom));
      commissionWhere += ` AND t."createdAt" >= $${commissionParams.length}`;
    }

    if (dateTo) {
      commissionParams.push(new Date(dateTo));
      commissionWhere += ` AND t."createdAt" <= $${commissionParams.length}`;
    }

    if (vendorId) {
      commissionParams.push(vendorId);
      commissionWhere += ` AND w."vendorId" = $${commissionParams.length}`;
    }

    const commissionResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM(ABS(t."amount")), 0)::float as "totalCommission" 
       FROM "WalletTransaction" t
       JOIN "Wallet" w ON t."walletId" = w."id"
       ${commissionWhere}`,
      ...commissionParams
    );

    const totalCommission = commissionResult[0].totalCommission;

    // Count active vendors
    let vendorWhere = `WHERE status = 'ACTIVE'`;
    const vendorParams: any[] = [];

    if (vendorId) {
      vendorParams.push(vendorId);
      vendorWhere += ` AND id = $${vendorParams.length}`;
    }

    const activeVendorsResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int as count FROM "Vendor" ${vendorWhere}`,
      ...vendorParams
    );

    const activeVendors = activeVendorsResult[0].count;

    // Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        thisMonthRevenue,
        totalCommission,
        activeVendors,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("[Admin Overview API] Failed to fetch overview stats:", error);
    console.error("[Admin Overview API] Error details:", error instanceof Error ? error.message : String(error));
    console.error("[Admin Overview API] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch overview statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
