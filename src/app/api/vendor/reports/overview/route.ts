/**
 * Vendor Overview Report API
 * GET /api/vendor/reports/overview - Vendor dashboard statistics (TryMe.lk vs My Website)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);

    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

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

    const validStatuses = [
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "PARTIALLY_SHIPPED",
      "DELIVERY_CONFIRMED",
      "DELIVERED",
      "COMPLETED",
    ];

    let baseWhere = `WHERE i."vendorId" = $1`;
    const queryParamsRaw: any[] = [vendorId];

    if (dateFrom) {
      queryParamsRaw.push(new Date(dateFrom));
      baseWhere += ` AND o."createdAt" >= $${queryParamsRaw.length}`;
    }

    if (dateTo) {
      const dateToObj = new Date(dateTo);
      dateToObj.setHours(23, 59, 59, 999);
      queryParamsRaw.push(dateToObj);
      baseWhere += ` AND o."createdAt" <= $${queryParamsRaw.length}`;
    }

    const validStatusesSql = validStatuses.map((s) => `'${s}'::"OrderStatus"`).join(", ");
    const revenueWhere = `${baseWhere} AND o."status" IN (${validStatusesSql})`;

    // 1. Combined Sales
    const salesResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(*)::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere}`,
      ...queryParamsRaw
    );
    const { totalSales, totalOrders, averageOrderValue } = salesResult[0];

    // 2. TryMe.lk Marketplace Sales (orderNumber NOT LIKE 'WEB-%')
    const trymeResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(*)::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere} AND o."orderNumber" NOT LIKE 'WEB-%'`,
      ...queryParamsRaw
    );

    // 3. Direct Website Sales (orderNumber LIKE 'WEB-%') - includes PENDING_PAYMENT (e.g. Bank Deposit awaiting confirmation) in totalOrders count
    const websiteRevenueResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(*)::int as "confirmedOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere} AND o."orderNumber" LIKE 'WEB-%'`,
      ...queryParamsRaw
    );

    const websiteAllOrdersResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COUNT(*)::int as "allWebsiteOrders",
        COALESCE(SUM(CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" THEN i."totalPrice" ELSE 0 END), 0)::float as "pendingVerificationSales",
        COUNT(CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" OR i."status" IN ('PENDING'::"OrderItemStatus", 'PROCESSING'::"OrderItemStatus") THEN 1 END)::int as "pendingActionOrders"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${baseWhere} AND o."orderNumber" LIKE 'WEB-%' AND o."status" != 'CANCELLED'::"OrderStatus"`,
      ...queryParamsRaw
    );

    // This Month Sales (Combined, TryMe, Website)
    const thisMonthStart = startOfMonth(new Date());
    const monthParams = [...queryParamsRaw, thisMonthStart];
    const monthWhere = revenueWhere + ` AND o."createdAt" >= $${monthParams.length}`;

    const thisMonthResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "thisMonthSales",
        COALESCE(SUM(CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "trymeMonthSales",
        COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "websiteMonthSales"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${monthWhere}`,
      ...monthParams
    );

    const { thisMonthSales, trymeMonthSales, websiteMonthSales } = thisMonthResult[0];

    // Wallet Balance
    const wallet = await prisma.wallet.findUnique({
      where: { vendorId },
      select: {
        pendingBalance: true,
        availableBalance: true,
      },
    });

    const pendingBalance = wallet?.pendingBalance.toNumber() || 0;
    const availableBalance = wallet?.availableBalance.toNumber() || 0;

    // Website Inquiries & Reviews count from VendorWebsiteConfig
    let websiteInquiriesCount = 0;
    let newInquiriesCount = 0;
    let websiteReviewsCount = 0;
    let trymeReviewsCount = 0;

    try {
      const [webCfg, tmReviews] = await Promise.all([
        prisma.vendorWebsiteConfig.findUnique({
          where: { vendorId },
          select: { contactSection: true, reviewsSection: true },
        }),
        prisma.productReview.count({
          where: { product: { vendorId }, isVisible: true },
        }),
      ]);
      trymeReviewsCount = tmReviews;

      const contactSec = (webCfg?.contactSection as any) || {};
      const inquiries = Array.isArray(contactSec.inquiries) ? contactSec.inquiries : [];
      websiteInquiriesCount = inquiries.length;
      newInquiriesCount = inquiries.filter((inq: any) => !inq.status || inq.status === "NEW").length;

      const revSec = (webCfg?.reviewsSection as any) || {};
      const webRevs = Array.isArray(revSec.websiteReviews) ? revSec.websiteReviews : [];
      const customRevs = Array.isArray(revSec.items) ? revSec.items : [];
      websiteReviewsCount = webRevs.length + customRevs.length;
    } catch {
      // ignore if table not ready
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        thisMonthSales,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue,
        trymeStats: {
          totalSales: trymeResult[0].totalSales,
          thisMonthSales: trymeMonthSales,
          totalOrders: trymeResult[0].totalOrders,
          averageOrderValue: trymeResult[0].averageOrderValue,
          pendingBalance,
          availableBalance,
          reviewsCount: trymeReviewsCount,
        },
        websiteStats: {
          totalSales: websiteRevenueResult[0].totalSales,
          thisMonthSales: websiteMonthSales,
          totalOrders: websiteAllOrdersResult[0].allWebsiteOrders,
          confirmedOrders: websiteRevenueResult[0].confirmedOrders,
          pendingVerificationSales: websiteAllOrdersResult[0].pendingVerificationSales,
          pendingActionOrders: websiteAllOrdersResult[0].pendingActionOrders,
          averageOrderValue: websiteRevenueResult[0].averageOrderValue,
          inquiriesCount: websiteInquiriesCount,
          newInquiriesCount,
          reviewsCount: websiteReviewsCount,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch vendor overview stats:", error);
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
