/**
 * Admin fail payout API
 * POST /api/admin/payouts/[payoutId]/fail - Mark payout as failed and refund
 * CRITICAL: This endpoint refunds to availableBalance
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { failPayoutSchema } from "@/lib/validations/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";



/**
 * POST /api/admin/payouts/[payoutId]/fail
 * Mark payout as failed and refund to wallet
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
    const validation = failPayoutSchema.safeParse(body);

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

    // CRITICAL: Fail payout and refund in atomic transaction
    const updatedPayout = await prisma.$transaction(async (tx) => {
      // 1. Verify status is PROCESSING
      if (payout.status !== "PROCESSING") {
        throw new Error("Payout must be PROCESSING to fail");
      }

      // 2. Calculate refund (add back to available balance)
      const newAvailableBalance = payout.wallet.availableBalance.add(
        payout.amount
      );

      // 3. Refund to wallet (CRITICAL: Add back to availableBalance)
      await tx.wallet.update({
        where: { id: payout.walletId },
        data: {
          availableBalance: newAvailableBalance,
        },
      });

      // 4. Create CREDIT transaction (reversal)
      await tx.walletTransaction.create({
        data: {
          walletId: payout.walletId,
          type: "CREDIT",
          amount: payout.amount,
          balanceBefore: payout.wallet.availableBalance,
          balanceAfter: newAvailableBalance,
          description: `Payout refund (failed): ${notes}`,
          metadata: {
            payoutId: payout.id,
            originalPayoutAmount: payout.amount.toNumber(),
            failureReason: notes,
            bankName: payout.bankName,
            accountNumber: payout.accountNumber,
          },
        },
      });

      // 5. Update payout status to FAILED
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          notes,
        },
      });

      return updated;
    });

    // Notify vendor about payout failure
    try {
      await createNotification({
        userId: payout.wallet.vendor.userId,
        type: NotificationType.PAYOUT_FAILED,
        title: 'Payout Failed',
        message: `Your payout request for Rs. ${updatedPayout.amount.toFixed(2)} could not be completed. The amount has been refunded to your available balance. Reason: ${notes}`,
        link: `/vendor/wallet`,
        metadata: {
          payoutId: updatedPayout.id,
          amount: updatedPayout.amount.toNumber(),
          failureReason: notes,
          bankName: updatedPayout.bankName,
          accountNumber: updatedPayout.accountNumber,
        },
      });
    } catch (notifError) {
      console.error('[Admin Fail Payout API] Failed to send notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        notes: updatedPayout.notes,
        processedAt: updatedPayout.processedAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error("[Admin Fail Payout API] Error failing payout:", error);

    // Handle known errors
    if (error.message === "Payout must be PROCESSING to fail") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to mark payout as failed" },
      { status: 500 }
    );
  }
}
