import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/wallet
 * Get Ads Seller wallet balance, statistics, and omnichannel channel breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { wallet, vendor } = sellerVendor;
    const vendorId = vendor.id;

    // Calculate this month's earnings
    const monthStart = startOfMonth(new Date());
    const thisMonthTransactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        createdAt: { gte: monthStart },
      },
    });

    let thisMonthEarnings = 0;
    for (const tx of thisMonthTransactions) {
      if (tx.type === "RELEASE") {
        thisMonthEarnings += tx.amount.toNumber();
      } else if (tx.type === "REFUND") {
        const amountNum = tx.amount.toNumber();
        if (amountNum < 0) {
          thisMonthEarnings += amountNum;
        } else {
          thisMonthEarnings -= amountNum;
        }
      } else if (tx.type === "COMMISSION") {
        const metadata = tx.metadata as any;
        if (
          metadata &&
          (metadata.disputeId || tx.description.toLowerCase().includes("reversal"))
        ) {
          thisMonthEarnings += tx.amount.toNumber();
        }
      }
    }

    // Count pending payouts
    const pendingPayouts = await prisma.payout.count({
      where: {
        walletId: wallet.id,
        status: "PENDING",
      },
    });

    // Count completed payouts
    const completedPayouts = await prisma.payout.count({
      where: {
        walletId: wallet.id,
        status: "COMPLETED",
      },
    });

    // Query Omnichannel Earnings (TryMe Marketplace, Website Direct, POS In-Store)
    const channelStats = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        -- TryMe Marketplace (Platform Escrow)
        COALESCE(SUM(CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "trymeSales",
        COUNT(DISTINCT CASE WHEN o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') THEN o."id" END)::int as "trymeOrders",
        
        -- Standalone Website Direct Sales (COD & Bank Deposit)
        COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN i."totalPrice" ELSE 0 END), 0)::float as "websiteSales",
        COUNT(DISTINCT CASE WHEN o."orderNumber" LIKE 'WEB-%' THEN o."id" END)::int as "websiteOrders",
        
        -- POS In-Store Walk-in Sales (Direct Cash/Card)
        COALESCE(SUM(CASE WHEN o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN i."totalPrice" ELSE 0 END), 0)::float as "posSales",
        COUNT(DISTINCT CASE WHEN o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN') THEN o."id" END)::int as "posOrders"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       WHERE i."vendorId" = $1 AND o."status" IN ('PAYMENT_CONFIRMED'::"OrderStatus", 'PROCESSING'::"OrderStatus", 'SHIPPED'::"OrderStatus", 'DELIVERED'::"OrderStatus", 'COMPLETED'::"OrderStatus")`,
      vendorId
    );

    const channelsData = channelStats[0] || {
      trymeSales: 0,
      trymeOrders: 0,
      websiteSales: 0,
      websiteOrders: 0,
      posSales: 0,
      posOrders: 0,
    };

    const channels = {
      trymeSales: Number(channelsData.trymeSales) || 0,
      trymeOrders: Number(channelsData.trymeOrders) || 0,
      websiteSales: Number(channelsData.websiteSales) || 0,
      websiteOrders: Number(channelsData.websiteOrders) || 0,
      posSales: Number(channelsData.posSales) || 0,
      posOrders: Number(channelsData.posOrders) || 0,
      totalAllChannelsRevenue:
        (Number(channelsData.trymeSales) || 0) +
        (Number(channelsData.websiteSales) || 0) +
        (Number(channelsData.posSales) || 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          businessName: vendor.businessName,
          isShopOpen: vendor.isShopOpen,
        },
        balance: {
          pendingBalance: wallet.pendingBalance.toNumber(),
          availableBalance: wallet.availableBalance.toNumber(),
          totalEarnings: wallet.totalEarnings.toNumber(),
          totalWithdrawn: wallet.totalWithdrawn.toNumber(),
        },
        stats: {
          thisMonthEarnings,
          pendingPayouts,
          completedPayouts,
        },
        channels,
        // Flat legacy fields
        id: wallet.id,
        vendorId: vendor.id,
        availableBalance: wallet.availableBalance.toNumber(),
        pendingBalance: wallet.pendingBalance.toNumber(),
        totalEarnings: wallet.totalEarnings.toNumber(),
        totalWithdrawn: wallet.totalWithdrawn.toNumber(),
        thisMonthEarnings,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching ads seller wallet:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to load wallet" }, { status: 500 });
  }
}
