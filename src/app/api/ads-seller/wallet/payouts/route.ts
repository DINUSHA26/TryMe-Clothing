import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import {
  requestPayoutSchema,
  vendorPayoutFiltersSchema,
} from "@/lib/validations/wallet";
import { maskAccountNumber } from "@/lib/utils/formatters";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * GET /api/ads-seller/wallet/payouts
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { wallet } = sellerVendor;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      status: searchParams.get("status") || undefined,
    };

    const validation = vendorPayoutFiltersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { page, pageSize, status } = validation.data;

    const where: Prisma.PayoutWhereInput = {
      walletId: wallet.id,
    };

    if (status) where.status = status;

    const totalCount = await prisma.payout.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount.toNumber(),
      status: payout.status,
      bankName: payout.bankName,
      branchCode: payout.branchCode,
      accountNumber: maskAccountNumber(payout.accountNumber),
      accountHolder: payout.accountHolder,
      processedAt: payout.processedAt?.toISOString() || null,
      transactionRef: payout.transactionRef,
      notes: payout.notes,
      createdAt: payout.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        payouts: formattedPayouts,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching ads seller payouts:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads-seller/wallet/payouts
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { vendor, wallet } = sellerVendor;

    const body = await request.json();
    const validation = requestPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, bankName, accountNumber, accountHolder, branchCode, notes } = validation.data;

    // Minimum payout validation
    const MIN_PAYOUT = 1000;
    if (amount < MIN_PAYOUT) {
      return NextResponse.json(
        { success: false, error: `Minimum payout request amount is Rs. ${MIN_PAYOUT.toLocaleString("en-LK")}` },
        { status: 400 }
      );
    }

    // Refresh wallet
    const freshWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id },
    });

    if (!freshWallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    const payout = await prisma.$transaction(async (tx) => {
      // 1. Check for existing pending payout
      const existingPending = await tx.payout.findFirst({
        where: {
          walletId: freshWallet.id,
          status: "PENDING",
        },
      });

      if (existingPending) {
        throw new Error("You already have a pending payout request");
      }

      // 2. Validate sufficient balance
      const amountDecimal = new Prisma.Decimal(amount);
      if (freshWallet.availableBalance.lessThan(amountDecimal)) {
        throw new Error("Insufficient available balance");
      }

      // 3. Create payout
      const newPayout = await tx.payout.create({
        data: {
          walletId: freshWallet.id,
          amount: amountDecimal,
          bankName,
          accountNumber,
          accountHolder,
          branchCode: branchCode || null,
          notes: notes || null,
          status: "PENDING",
        },
      });

      return newPayout;
    });

    // Notify admins if possible
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.PAYOUT_REQUESTED,
          title: "Payout Request Received",
          message: `Ads Seller ${vendor.businessName || "Store"} has requested a payout of Rs. ${payout.amount.toFixed(2)}.`,
          link: `/admin/payouts`,
          metadata: {
            payoutId: payout.id,
            payoutAmount: payout.amount.toNumber(),
            vendorName: vendor.businessName,
          },
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify admins of ads seller payout:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payout requested successfully",
        data: {
          id: payout.id,
          amount: payout.amount.toNumber(),
          status: payout.status,
          createdAt: payout.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ads seller payout request:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payout request" },
      { status: 500 }
    );
  }
}
