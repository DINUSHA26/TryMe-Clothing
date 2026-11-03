import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/wallet
 * Get Ads Seller wallet balance and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { wallet, vendor } = sellerVendor;

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
        thisMonthEarnings += amountNum > 0 ? -amountNum : amountNum;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
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
