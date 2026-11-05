/**
 * Vendor Overview Report API
 * GET /api/vendor/reports/overview - Vendor dashboard statistics (TryMe.lk vs My Website vs POS)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError, AuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    let vendorId: string;

    if (user.role === UserRole.VENDOR) {
      const vendorRecord = await prisma.vendor.findUnique({
        where: { userId: user.userId },
      });
      if (!vendorRecord) {
        return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
      }
      vendorId = vendorRecord.id;
    } else if (user.role === UserRole.ADS_SELLER) {
      const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
      if (!sellerVendor) {
        return NextResponse.json({ success: false, error: "Ads seller profile not found" }, { status: 404 });
      }
      vendorId = sellerVendor.vendor.id;
    } else {
      throw new AuthError("Forbidden: Vendor or Ads Seller access required", 403);
    }

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
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere}`,
      ...queryParamsRaw
    );
    const totalSales = Number(salesResult[0]?.totalSales) || 0;
    const totalOrders = Number(salesResult[0]?.totalOrders) || 0;
    const averageOrderValue = Number(salesResult[0]?.averageOrderValue) || 0;

    // 2. TryMe.lk Marketplace Sales (orderNumber NOT LIKE 'WEB-%' AND NOT LIKE 'POS-%')
    const trymeResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere} AND o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN')`,
      ...queryParamsRaw
    );
    const trymeData = trymeResult[0] || {};

    // 3. Direct Website Sales (orderNumber LIKE 'WEB-%')
    const websiteRevenueResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(DISTINCT o."id")::int as "confirmedOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere} AND o."orderNumber" LIKE 'WEB-%'`,
      ...queryParamsRaw
    );
    const websiteRevenueData = websiteRevenueResult[0] || {};

    const websiteAllOrdersResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COUNT(DISTINCT o."id")::int as "allWebsiteOrders",
        COALESCE(SUM(CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" THEN i."totalPrice" ELSE 0 END), 0)::float as "pendingVerificationSales",
        COUNT(DISTINCT CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" OR i."status" IN ('PENDING_PAYMENT'::"OrderStatus", 'PROCESSING'::"OrderStatus") THEN o."id" END)::int as "pendingActionOrders"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${baseWhere} AND o."orderNumber" LIKE 'WEB-%' AND o."status" != 'CANCELLED'::"OrderStatus"`,
      ...queryParamsRaw
    );
    const websiteAllData = websiteAllOrdersResult[0] || {};

    // 4. In-Store POS Retail Counter Sales (orderNumber LIKE 'POS-%' OR orderSource = 'POS_WALK_IN')
    const posRevenueResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${revenueWhere} AND (o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN'))`,
      ...queryParamsRaw
    );
    const posData = posRevenueResult[0] || {};

    // This Month Sales (Combined, TryMe, Website, POS)
    const thisMonthStart = startOfMonth(new Date());
    const monthParams = [...queryParamsRaw, thisMonthStart];
    const monthWhere = revenueWhere + ` AND o."createdAt" >= $${monthParams.length}`;

    const thisMonthResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "thisMonthSales",
        COALESCE(SUM(CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "trymeMonthSales",
        COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "websiteMonthSales",
        COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "posMonthSales"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${monthWhere}`,
      ...monthParams
    );
    const monthData = thisMonthResult[0] || {};

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
        thisMonthSales: Number(monthData.thisMonthSales) || 0,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue,
        trymeStats: {
          totalSales: Number(trymeData.totalSales) || 0,
          thisMonthSales: Number(monthData.trymeMonthSales) || 0,
          totalOrders: Number(trymeData.totalOrders) || 0,
          averageOrderValue: Number(trymeData.averageOrderValue) || 0,
          pendingBalance,
          availableBalance,
          reviewsCount: trymeReviewsCount,
        },
        websiteStats: {
          totalSales: Number(websiteRevenueData.totalSales) || 0,
          thisMonthSales: Number(monthData.websiteMonthSales) || 0,
          totalOrders: Number(websiteAllData.allWebsiteOrders) || 0,
          confirmedOrders: Number(websiteRevenueData.confirmedOrders) || 0,
          pendingVerificationSales: Number(websiteAllData.pendingVerificationSales) || 0,
          pendingActionOrders: Number(websiteAllData.pendingActionOrders) || 0,
          averageOrderValue: Number(websiteRevenueData.averageOrderValue) || 0,
          inquiriesCount: websiteInquiriesCount,
          newInquiriesCount,
          reviewsCount: websiteReviewsCount,
        },
        posStats: {
          totalSales: Number(posData.totalSales) || 0,
          thisMonthSales: Number(monthData.posMonthSales) || 0,
          totalOrders: Number(posData.totalOrders) || 0,
          averageOrderValue: Number(posData.averageOrderValue) || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch vendor overview stats:", error?.message || error);
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
