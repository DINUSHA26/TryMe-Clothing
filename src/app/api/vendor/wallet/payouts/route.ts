/**
 * Vendor wallet payouts API
 * GET /api/vendor/wallet/payouts - Get payout history
 * POST /api/vendor/wallet/payouts - Request new payout
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import {
  requestPayoutSchema,
  vendorPayoutFiltersSchema,
} from "@/lib/validations/wallet";
import { maskAccountNumber } from "@/lib/utils/formatters";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * GET /api/vendor/wallet/payouts
 * Get payout history with pagination and filtering
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

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Parse and validate query parameters
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

    // Build where clause
    const where: any = {
      walletId: wallet.id,
    };

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.payout.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch payouts
    const payouts = await prisma.payout.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Format payouts for response (mask account numbers)
    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount.toNumber(),
      bankName: payout.bankName,
      accountNumber: maskAccountNumber(payout.accountNumber),
      accountHolder: payout.accountHolder,
      branchCode: payout.branchCode,
      status: payout.status,
      notes: payout.notes,
      transactionRef: payout.transactionRef,
      processedAt: payout.processedAt?.toISOString() || null,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
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
  } catch (error) {
    console.error(
      "[Vendor Wallet Payouts API] Error fetching payouts:",
      error
    );

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/wallet/payouts
 * Request a new payout
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = requestPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, bankName, accountNumber, accountHolder, branchCode, notes } =
      validation.data;

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Create payout in transaction
    const payout = await prisma.$transaction(async (tx) => {
      // 1. Check for existing pending payout
      const existingPending = await tx.payout.findFirst({
        where: {
          walletId: wallet.id,
          status: "PENDING",
        },
      });

      if (existingPending) {
        throw new Error("You already have a pending payout request");
      }

      // 2. Validate sufficient balance
      const amountDecimal = new Prisma.Decimal(amount);
      if (wallet.availableBalance.lessThan(amountDecimal)) {
        throw new Error("Insufficient available balance");
      }

      // 3. Create payout (do NOT deduct balance yet - that happens when admin approves)
      const newPayout = await tx.payout.create({
        data: {
          walletId: wallet.id,
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

    // Notify all admins about payout request
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.PAYOUT_REQUESTED,
          title: 'Payout Request Received',
          message: `Vendor ${vendorRecord.businessName || 'Unknown'} has requested a payout of Rs. ${payout.amount.toFixed(2)}.`,
          link: `/admin/payouts`,
          metadata: {
            payoutId: payout.id,
            payoutAmount: payout.amount.toNumber(),
            vendorName: vendorRecord.businessName,
          },
        });
      }
    } catch (notifError) {
      console.error('[Vendor Wallet Payouts API] Failed to send notification:', notifError);
    }

    return NextResponse.json(
      {
        success: true,
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
    console.error("[Vendor Wallet Payouts API] Error creating payout:", error);

    // Handle known errors
    if (error.message === "You already have a pending payout request") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    if (error.message === "Insufficient available balance") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}
