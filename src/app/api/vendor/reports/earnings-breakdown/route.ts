/**
 * Vendor Earnings Breakdown Report API
 * GET /api/vendor/reports/earnings-breakdown - Monthly earnings with commission
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revenueTrendsFiltersSchema } from "@/lib/validations/report";
import { format } from "date-fns";

/**
 * GET /api/vendor/reports/earnings-breakdown
 * Get earnings breakdown by month (gross, commission, net)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      period: searchParams.get("period") || "monthly",
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = revenueTrendsFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { period, dateFrom, dateTo } = validation.data;

    // Force monthly for earnings breakdown
    const dateTrunc = "month";

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    // Build where condition
    let whereCondition = `oi."vendorId" = '${vendorId}' AND o."status" IN ('PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED', 'PARTIALLY_SHIPPED', 'DELIVERY_CONFIRMED', 'DELIVERED', 'COMPLETED')`;

    if (dateFrom) {
      whereCondition += ` AND o."createdAt" >= '${dateFrom}'::timestamp`;
    }

    if (dateTo) {
      whereCondition += ` AND o."createdAt" <= '${dateTo} 23:59:59.999'::timestamp`;
    }

    // Query for sales
    const query = `
      SELECT
        DATE_TRUNC('${dateTrunc}', o."createdAt") as date,
        SUM(oi."totalPrice") as gross_sales
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE ${whereCondition}
      GROUP BY DATE_TRUNC('${dateTrunc}', o."createdAt")
      ORDER BY date ASC
    `;

    const trends = await prisma.$queryRawUnsafe<
      Array<{ date: Date; gross_sales: any }>
    >(query);

    // Get vendor commission rate
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { commissionRate: true },
    });

    const commissionRate = vendor?.commissionRate.toNumber() || 0.1;

    // Format data
    const labels: string[] = [];
    const grossSales: number[] = [];
    const commission: number[] = [];
    const netEarnings: number[] = [];

    trends.forEach((item) => {
      const date = new Date(item.date);
      const label = format(date, "MMM yyyy");

      const gross = parseFloat(item.gross_sales.toString()) || 0;
      const comm = gross * commissionRate;
      const net = gross - comm;

      labels.push(label);
      grossSales.push(gross);
      commission.push(comm);
      netEarnings.push(net);
    });

    return NextResponse.json({
      success: true,
      data: {
        labels,
        grossSales,
        commission,
        netEarnings,
      },
    });
  } catch (error) {
    console.error("Failed to fetch earnings breakdown:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch earnings breakdown",
      },
      { status: 500 }
    );
  }
}
