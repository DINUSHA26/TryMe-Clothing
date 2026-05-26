/**
 * Vendor wallet payout cancellation API
 * DELETE /api/vendor/wallet/payouts/[payoutId] - Cancel pending payout
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/vendor/wallet/payouts/[payoutId]
 * Cancel a pending payout request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
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

    const { payoutId } = await params;

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

    // Find payout and verify ownership
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payout.walletId !== wallet.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verify status is PENDING
    if (payout.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Can only cancel pending payout requests",
        },
        { status: 400 }
      );
    }

    // Delete payout
    await prisma.payout.delete({
      where: { id: payoutId },
    });

    return NextResponse.json({
      success: true,
      message: "Payout cancelled successfully",
    });
  } catch (error) {
    console.error(
      "[Vendor Wallet Payout Cancellation API] Error cancelling payout:",
      error
    );

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to cancel payout" },
      { status: 500 }
    );
  }
}
