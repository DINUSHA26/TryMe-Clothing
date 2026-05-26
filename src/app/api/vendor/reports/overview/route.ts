/**
 * Vendor Overview Report API
 * GET /api/vendor/reports/overview - Vendor dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";

/**
 * GET /api/vendor/reports/overview
 * Get dashboard statistics for vendor
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = adminOverviewFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo } = validation.data;

    // Define valid statuses for revenue
    const validStatuses = [
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "PARTIALLY_SHIPPED",
      "DELIVERY_CONFIRMED",
      "DELIVERED",
      "COMPLETED",
    ];

    // Build dynamic WHERE clause for raw SQL
    let whereClause = `WHERE i."vendorId" = $1 AND o."status" IN (${validStatuses.map(s => `'${s}'::"OrderStatus"`).join(', ')})`;
    const queryParamsRaw: any[] = [vendorId];

    if (dateFrom) {
      queryParamsRaw.push(new Date(dateFrom));
      whereClause += ` AND o."createdAt" >= $${queryParamsRaw.length}`;
    }

    if (dateTo) {
      const dateToObj = new Date(dateTo);
      dateToObj.setHours(23, 59, 59, 999);
      queryParamsRaw.push(dateToObj);
      whereClause += ` AND o."createdAt" <= $${queryParamsRaw.length}`;
    }

    // Calculate total sales
    const salesResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(*)::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${whereClause}`,
      ...queryParamsRaw
    );

    const { totalSales, totalOrders, averageOrderValue } = salesResult[0];

    // Calculate this month's sales
    const thisMonthStart = startOfMonth(new Date());
    const monthParams = [...queryParamsRaw, thisMonthStart];
    const monthWhere = whereClause + ` AND o."createdAt" >= $${monthParams.length}`;
    
    const thisMonthResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM(i."totalPrice"), 0)::float as "thisMonthSales" 
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${monthWhere}`,
      ...monthParams
    );

    const thisMonthSales = thisMonthResult[0].thisMonthSales;

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: {
        vendorId,
      },
      select: {
        pendingBalance: true,
        availableBalance: true,
      },
    });

    const pendingBalance = wallet?.pendingBalance.toNumber() || 0;
    const availableBalance = wallet?.availableBalance.toNumber() || 0;

    // Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        thisMonthSales,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("Failed to fetch vendor overview stats:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch overview statistics",
      },
      { status: 500 }
    );
  }
}
