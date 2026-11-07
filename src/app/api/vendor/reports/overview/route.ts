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

    const thisMonthStart = startOfMonth(new Date());
    const combinedParams = [...queryParamsRaw, thisMonthStart];
    const monthParamIdx = combinedParams.length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Optimized: Execute all database queries concurrently in parallel
    const [
      revenueResult,
      websiteAllOrdersResult,
      wallet,
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      todayOrdersResult,
      todayPosOrdersResult,
      pendingFulfillmentResult,
      webCfg,
      tmReviews,
    ] = await Promise.all([
      // 1. Unified Revenue & Breakdown Aggregation (Combined, TryMe, Website, POS, This Month)
      prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          -- Combined
          COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
          COUNT(DISTINCT o."id")::int as "totalOrders",
          COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue",

          -- TryMe Marketplace
          COALESCE(SUM(CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "trymeSales",
          COUNT(DISTINCT CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN o."id" END)::int as "trymeOrders",
          COALESCE(AVG(CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN i."totalPrice" END), 0)::float as "trymeAvgOrderValue",

          -- Direct Website (Confirmed Revenue)
          COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "websiteSales",
          COUNT(DISTINCT CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN o."id" END)::int as "websiteConfirmedOrders",
          COALESCE(AVG(CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" END), 0)::float as "websiteAvgOrderValue",

          -- POS Retail Counter
          COALESCE(SUM(CASE WHEN (o."orderNumber" LIKE 'POS-%' OR o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "posSales",
          COUNT(DISTINCT CASE WHEN (o."orderNumber" LIKE 'POS-%' OR o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN o."id" END)::int as "posOrders",
          COALESCE(AVG(CASE WHEN (o."orderNumber" LIKE 'POS-%' OR o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN i."totalPrice" END), 0)::float as "posAvgOrderValue",

          -- This Month Breakdowns
          COALESCE(SUM(CASE WHEN o."createdAt" >= $${monthParamIdx} THEN i."totalPrice" ELSE 0 END), 0)::float as "thisMonthSales",
          COALESCE(SUM(CASE WHEN o."createdAt" >= $${monthParamIdx} AND o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "trymeMonthSales",
          COALESCE(SUM(CASE WHEN o."createdAt" >= $${monthParamIdx} AND o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "websiteMonthSales",
          COALESCE(SUM(CASE WHEN o."createdAt" >= $${monthParamIdx} AND (o."orderNumber" LIKE 'POS-%' OR o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "posMonthSales"
         FROM "OrderItem" i
         JOIN "Order" o ON i."orderId" = o."id"
         ${revenueWhere}`,
        ...combinedParams
      ),

      // 2. All Website Orders & Pending Verification
      prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          COUNT(DISTINCT o."id")::int as "allWebsiteOrders",
          COALESCE(SUM(CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" THEN i."totalPrice" ELSE 0 END), 0)::float as "pendingVerificationSales",
          COUNT(DISTINCT CASE WHEN o."status" = 'PENDING_PAYMENT'::"OrderStatus" OR i."status" IN ('PENDING_PAYMENT'::"OrderStatus", 'PROCESSING'::"OrderStatus") THEN o."id" END)::int as "pendingActionOrders"
         FROM "OrderItem" i
         JOIN "Order" o ON i."orderId" = o."id"
         ${baseWhere} AND o."orderNumber" LIKE 'WEB-%' AND o."status" != 'CANCELLED'::"OrderStatus"`,
        ...queryParamsRaw
      ),

      // 3. Wallet Balance (restricted to owners and staff with wallet.view)
      hasFinancialAccess
        ? prisma.wallet.findUnique({
            where: { vendorId },
            select: { pendingBalance: true, availableBalance: true },
          })
        : Promise.resolve(null),

      // 4-10. Operational statistics
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

      // 11-12. Website inquiries & reviews
      prisma.vendorWebsiteConfig
        .findUnique({
          where: { vendorId },
          select: { contactSection: true, reviewsSection: true },
        })
        .catch(() => null),
      prisma.productReview
        .count({
          where: { product: { vendorId }, isVisible: true },
        })
        .catch(() => 0),
    ]);

    const revData = revenueResult[0] || {};
    const websiteAllData = websiteAllOrdersResult[0] || {};

    const totalSales = Number(revData.totalSales) || 0;
    const totalOrders = Number(revData.totalOrders) || 0;
    const averageOrderValue = Number(revData.averageOrderValue) || 0;

    const pendingBalance = wallet ? wallet.pendingBalance.toNumber() : null;
    const availableBalance = wallet ? wallet.availableBalance.toNumber() : null;

    const todayOrders = Number(todayOrdersResult[0]?.count) || 0;
    const todayPosOrders = Number(todayPosOrdersResult[0]?.count) || 0;
    const pendingFulfillment = Number(pendingFulfillmentResult[0]?.count) || 0;

    let websiteInquiriesCount = 0;
    let newInquiriesCount = 0;
    let websiteReviewsCount = 0;
    const trymeReviewsCount = tmReviews || 0;

    if (webCfg) {
      const contactSec = (webCfg.contactSection as any) || {};
      const inquiries = Array.isArray(contactSec.inquiries) ? contactSec.inquiries : [];
      websiteInquiriesCount = inquiries.length;
      newInquiriesCount = inquiries.filter((inq: any) => !inq.status || inq.status === "NEW").length;

      const revSec = (webCfg.reviewsSection as any) || {};
      const webRevs = Array.isArray(revSec.websiteReviews) ? revSec.websiteReviews : [];
      const customRevs = Array.isArray(revSec.items) ? revSec.items : [];
      websiteReviewsCount = webRevs.length + customRevs.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasFinancialAccess,
        totalSales: hasFinancialAccess ? totalSales : null,
        thisMonthSales: hasFinancialAccess ? Number(revData.thisMonthSales) || 0 : null,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue: hasFinancialAccess ? averageOrderValue : null,
        trymeStats: {
          totalSales: hasFinancialAccess ? Number(revData.trymeSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(revData.trymeMonthSales) || 0 : null,
          totalOrders: Number(revData.trymeOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(revData.trymeAvgOrderValue) || 0 : null,
          pendingBalance,
          availableBalance,
          reviewsCount: trymeReviewsCount,
        },
        websiteStats: {
          totalSales: hasFinancialAccess ? Number(revData.websiteSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(revData.websiteMonthSales) || 0 : null,
          totalOrders: Number(websiteAllData.allWebsiteOrders) || 0,
          confirmedOrders: Number(revData.websiteConfirmedOrders) || 0,
          pendingVerificationSales: hasFinancialAccess ? Number(websiteAllData.pendingVerificationSales) || 0 : null,
          pendingActionOrders: Number(websiteAllData.pendingActionOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(revData.websiteAvgOrderValue) || 0 : null,
          inquiriesCount: websiteInquiriesCount,
          newInquiriesCount,
          reviewsCount: websiteReviewsCount,
        },
        posStats: {
          totalSales: hasFinancialAccess ? Number(revData.posSales) || 0 : null,
          thisMonthSales: hasFinancialAccess ? Number(revData.posMonthSales) || 0 : null,
          totalOrders: Number(revData.posOrders) || 0,
          averageOrderValue: hasFinancialAccess ? Number(revData.posAvgOrderValue) || 0 : null,
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
