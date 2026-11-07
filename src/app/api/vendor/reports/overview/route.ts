/**
 * Vendor Overview Report API
 * GET /api/vendor/reports/overview - Vendor dashboard statistics (TryMe.lk vs My Website vs POS)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError, AuthError, getEffectiveVendor } from "@/lib/auth-helpers";
import { getVendorAccess, getAdsSellerAccess } from "@/lib/rbac";
import { StoreAccessInfo } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    let vendorId: string;
    let access: StoreAccessInfo;

    if (user.role === UserRole.VENDOR) {
      const effective = await getEffectiveVendor(user.userId);
      if (!effective) {
        return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
      }
      vendorId = effective.vendor.id;
      access = await getVendorAccess(user.userId);
    } else if (user.role === UserRole.ADS_SELLER) {
      const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
      if (!sellerVendor) {
        return NextResponse.json({ success: false, error: "Ads seller profile not found" }, { status: 404 });
      }
      vendorId = sellerVendor.vendor.id;
      access = await getAdsSellerAccess(user.userId);
    } else {
      throw new AuthError("Forbidden: Vendor or Ads Seller access required", 403);
    }

    const hasFinancialAccess = access.isOwner || access.permissions.includes("wallet.view");

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

    // Wallet Balance (restricted to owners and staff with wallet.view)
    let pendingBalance: number | null = null;
    let availableBalance: number | null = null;

    if (hasFinancialAccess) {
      const wallet = await prisma.wallet.findUnique({
        where: { vendorId },
        select: {
          pendingBalance: true,
          availableBalance: true,
        },
      });
      pendingBalance = wallet?.pendingBalance.toNumber() || 0;
      availableBalance = wallet?.availableBalance.toNumber() || 0;
    }

    // Operational statistics for all roles (Products, low stock, today orders, fulfillment)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      todayOrdersResult,
      todayPosOrdersResult,
      pendingFulfillmentResult,
    ] = await Promise.all([
      prisma.product.count({ where: { vendorId } }),
      prisma.product.count({ where: { vendorId, isActive: true } }),
      prisma.product.count({ where: { vendorId, stock: { lte: 5, gt: 0 } } }),
      prisma.product.count({ where: { vendorId, stock: 0 } }),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(DISTINCT o."id")::int as count
         FROM "OrderItem" i
         JOIN "Order" o ON i."orderId" = o."id"
         WHERE i."vendorId" = $1 AND o."createdAt" >= $2 AND o."status" != 'CANCELLED'::"OrderStatus"`,
        vendorId,
        todayStart
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(DISTINCT o."id")::int as count
         FROM "OrderItem" i
         JOIN "Order" o ON i."orderId" = o."id"
         WHERE i."vendorId" = $1 AND o."createdAt" >= $2 AND o."status" != 'CANCELLED'::"OrderStatus"
           AND (o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN'))`,
        vendorId,
        todayStart
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(DISTINCT o."id")::int as count
         FROM "OrderItem" i
         JOIN "Order" o ON i."orderId" = o."id"
         WHERE i."vendorId" = $1 AND o."status" IN ('PAYMENT_CONFIRMED'::"OrderStatus", 'PROCESSING'::"OrderStatus")`,
        vendorId
      ),
    ]);

    const todayOrders = Number(todayOrdersResult[0]?.count) || 0;
    const todayPosOrders = Number(todayPosOrdersResult[0]?.count) || 0;
    const pendingFulfillment = Number(pendingFulfillmentResult[0]?.count) || 0;

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
        hasFinancialAccess,
        totalSales: hasFinancialAccess ? totalSales : null,
        thisMonthSales: hasFinancialAccess ? Number(monthData.thisMonthSales) || 0 : null,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue: hasFinancialAccess ? averageOrderValue : null,
        trymeStats: {
          totalSales: hasFinancialAccess ? Number(trymeData.totalSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(monthData.trymeMonthSales) || 0 : null,
          totalOrders: Number(trymeData.totalOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(trymeData.averageOrderValue) || 0 : null,
          pendingBalance,
          availableBalance,
          reviewsCount: trymeReviewsCount,
        },
        websiteStats: {
          totalSales: hasFinancialAccess ? Number(websiteRevenueData.totalSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(monthData.websiteMonthSales) || 0 : null,
          totalOrders: Number(websiteAllData.allWebsiteOrders) || 0,
          confirmedOrders: Number(websiteRevenueData.confirmedOrders) || 0,
          pendingVerificationSales: hasFinancialAccess ? Number(websiteAllData.pendingVerificationSales) || 0 : null,
          pendingActionOrders: Number(websiteAllData.pendingActionOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(websiteRevenueData.averageOrderValue) || 0 : null,
          inquiriesCount: websiteInquiriesCount,
          newInquiriesCount,
          reviewsCount: websiteReviewsCount,
        },
        posStats: {
          totalSales: hasFinancialAccess ? Number(posData.totalSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(monthData.posMonthSales) || 0 : null,
          totalOrders: Number(posData.totalOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(posData.averageOrderValue) || 0 : null,
        },
        operationalStats: {
          totalProducts,
          activeProducts,
          lowStockCount,
          outOfStockCount,
          todayOrders,
          todayPosOrders,
          pendingFulfillment,
        },
        roleInfo: {
          isOwner: access.isOwner,
          roleName: access.roleName,
          permissions: access.permissions,
          hasFinancialAccess,
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
