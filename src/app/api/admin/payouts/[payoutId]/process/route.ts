/**
 * Admin process payout API
 * POST /api/admin/payouts/[payoutId]/process - Approve and start processing payout
 * CRITICAL: This endpoint deducts from availableBalance
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { processPayoutSchema } from "@/lib/validations/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";



/**
 * POST /api/admin/payouts/[payoutId]/process
 * Approve payout and mark as PROCESSING (deducts balance)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    // Auth check
    requireAdmin(request);

    const { payoutId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = processPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { notes } = validation.data;

    // Fetch payout with wallet and vendor
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        wallet: {
          include: {
            vendor: {
              select: {
                userId: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // CRITICAL: Process payout in atomic transaction
    const updatedPayout = await prisma.$transaction(async (tx) => {
      // 1. Verify status is PENDING
      if (payout.status !== "PENDING") {
        throw new Error("Payout must be PENDING to process");
      }

      // 2. Verify sufficient balance
      if (payout.wallet.availableBalance.lessThan(payout.amount)) {
        throw new Error("Insufficient available balance");
      }

      // 3. Calculate new balance
      const newAvailableBalance = payout.wallet.availableBalance.sub(
        payout.amount
      );

      // 4. Update wallet balance (CRITICAL: Deduct from availableBalance)
      await tx.wallet.update({
        where: { id: payout.walletId },
        data: {
          availableBalance: newAvailableBalance,
        },
      });

      // 5. Create PAYOUT transaction
      await tx.walletTransaction.create({
        data: {
          walletId: payout.walletId,
          type: "PAYOUT",
          amount: payout.amount,
          balanceBefore: payout.wallet.availableBalance,
          balanceAfter: newAvailableBalance,
          description: `Payout to ${payout.bankName} - ${payout.accountNumber}`,
          metadata: {
            payoutId: payout.id,
            bankName: payout.bankName,
            accountNumber: payout.accountNumber,
            accountHolder: payout.accountHolder,
            branchCode: payout.branchCode,
          },
        },
      });

      // 6. Update payout status to PROCESSING
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: "PROCESSING",
          notes: notes || payout.notes,
        },
      });

      return updated;
    });

    // Notify vendor about payout approval
    try {
      await createNotification({
        userId: payout.wallet.vendor.userId,
        type: NotificationType.PAYOUT_APPROVED,
        title: 'Payout Approved',
        message: `Your payout request for Rs. ${updatedPayout.amount.toFixed(2)} has been approved and is being processed.`,
        link: `/vendor/wallet`,
        metadata: {
          payoutId: updatedPayout.id,
          amount: updatedPayout.amount.toNumber(),
          bankName: updatedPayout.bankName,
          accountNumber: updatedPayout.accountNumber,
        },
      });
    } catch (notifError) {
      console.error('[Admin Process Payout API] Failed to send notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        amount: updatedPayout.amount.toNumber(),
        notes: updatedPayout.notes,
      },
    });
  } catch (error: any) {
    console.error("[Admin Process Payout API] Error processing payout:", error);

    // Handle known errors
    if (error.message === "Payout must be PENDING to process") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.message === "Insufficient available balance") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
