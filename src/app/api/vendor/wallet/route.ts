/**
 * Vendor wallet API
 * GET /api/vendor/wallet - Get wallet balance and stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

/**
 * GET /api/vendor/wallet
 * Get vendor wallet balance and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Look up vendor record (TokenPayload has no vendorId field)
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    // Fetch wallet with balances
    const wallet = await prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Calculate this month's earnings (including releases, dispute refunds, and commission reversals)
    const monthStart = startOfMonth(new Date());
    const thisMonthTransactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        createdAt: {
          gte: monthStart,
        },
      },
    });

    let thisMonthEarnings = 0;
    for (const tx of thisMonthTransactions) {
      if (tx.type === "RELEASE") {
        thisMonthEarnings += tx.amount.toNumber();
      } else if (tx.type === "REFUND") {
        const amountNum = tx.amount.toNumber();
        if (amountNum < 0) {
          thisMonthEarnings += amountNum; // Negative value debits available balance
        }
      } else if (tx.type === "COMMISSION") {
        const metadata = tx.metadata as any;
        if (
          metadata &&
          (metadata.disputeId || tx.description.toLowerCase().includes("reversal"))
        ) {
          thisMonthEarnings += tx.amount.toNumber(); // Legacy commission reversals credit available balance
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

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          businessName: vendorRecord.businessName,
          isShopOpen: vendorRecord.isShopOpen,
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
      },
    });
  } catch (error) {
    console.error("[Vendor Wallet API] Error fetching wallet:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
