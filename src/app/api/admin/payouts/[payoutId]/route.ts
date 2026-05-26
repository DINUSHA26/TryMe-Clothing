/**
 * Admin payout details API
 * GET /api/admin/payouts/[payoutId] - Get full payout details
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";



/**
 * GET /api/admin/payouts/[payoutId]
 * Get full payout details with vendor wallet snapshot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    // Auth check
    requireAdmin(request);

    const { payoutId } = await params;

    // Fetch payout with vendor and wallet information
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        wallet: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                businessEmail: true,
                commissionRate: true,
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

    // Get recent RELEASE transactions for this vendor (last 5)
    const relatedTransactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: payout.walletId,
        type: "RELEASE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Format response (admin sees FULL account number - NOT masked)
    return NextResponse.json({
      success: true,
      data: {
        payout: {
          id: payout.id,
          amount: payout.amount.toNumber(),
          bankName: payout.bankName,
          accountNumber: payout.accountNumber, // Full account number for admin
          accountHolder: payout.accountHolder,
          branchCode: payout.branchCode,
          status: payout.status,
          notes: payout.notes,
          transactionRef: payout.transactionRef,
          processedAt: payout.processedAt?.toISOString() || null,
          createdAt: payout.createdAt.toISOString(),
          updatedAt: payout.updatedAt.toISOString(),
        },
        vendor: {
          id: payout.wallet.vendor.id,
          businessName: payout.wallet.vendor.businessName,
          businessEmail: payout.wallet.vendor.businessEmail,
          currentAvailableBalance: payout.wallet.availableBalance.toNumber(),
          pendingBalance: payout.wallet.pendingBalance.toNumber(),
          commissionRate: payout.wallet.vendor.commissionRate.toNumber(),
        },
        relatedTransactions: relatedTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount.toNumber(),
          balanceBefore: tx.balanceBefore.toNumber(),
          balanceAfter: tx.balanceAfter.toNumber(),
          description: tx.description,
          metadata: tx.metadata as Record<string, any> | null,
          createdAt: tx.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error(
      "[Admin Payout Details API] Error fetching payout details:",
      error
    );

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch payout details" },
      { status: 500 }
    );
  }
}
