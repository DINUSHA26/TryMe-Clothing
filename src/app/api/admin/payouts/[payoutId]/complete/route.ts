/**
 * Admin complete payout API
 * POST /api/admin/payouts/[payoutId]/complete - Mark payout as completed
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { completePayoutSchema } from "@/lib/validations/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";



/**
 * POST /api/admin/payouts/[payoutId]/complete
 * Mark payout as completed (bank transfer successful)
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
    const validation = completePayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { transactionRef, notes } = validation.data;

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

    // Complete payout in atomic transaction
    const updatedPayout = await prisma.$transaction(async (tx) => {
      // 1. Verify status is PROCESSING
      if (payout.status !== "PROCESSING") {
        throw new Error("Payout must be PROCESSING to complete");
      }

      // 2. Update payout status to COMPLETED
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          transactionRef,
          notes: notes || payout.notes,
        },
      });

      // 3. Increment totalWithdrawn in wallet
      await tx.wallet.update({
        where: { id: payout.walletId },
        data: {
          totalWithdrawn: payout.wallet.totalWithdrawn.add(payout.amount),
        },
      });

      return updated;
    });

    // Notify vendor about payout completion
    try {
      await createNotification({
        userId: payout.wallet.vendor.userId,
        type: NotificationType.PAYOUT_COMPLETED,
        title: 'Payout Completed',
        message: `Your payout of Rs. ${updatedPayout.amount.toFixed(2)} has been successfully transferred. Transaction reference: ${transactionRef}`,
        link: `/vendor/wallet`,
        metadata: {
          payoutId: updatedPayout.id,
          amount: updatedPayout.amount.toNumber(),
          transactionRef,
          bankName: updatedPayout.bankName,
          accountNumber: updatedPayout.accountNumber,
        },
      });
    } catch (notifError) {
      console.error('[Admin Complete Payout API] Failed to send notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        transactionRef: updatedPayout.transactionRef,
        processedAt: updatedPayout.processedAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error("[Admin Complete Payout API] Error completing payout:", error);

    // Handle known errors
    if (error.message === "Payout must be PROCESSING to complete") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to complete payout" },
      { status: 500 }
    );
  }
}
