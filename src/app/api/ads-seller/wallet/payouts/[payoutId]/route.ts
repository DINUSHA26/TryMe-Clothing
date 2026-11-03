import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * DELETE /api/ads-seller/wallet/payouts/[payoutId]
 * Cancel a pending payout request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { wallet } = sellerVendor;
    const { payoutId } = await params;

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
  } catch (error: any) {
    console.error("Error cancelling ads seller payout:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel payout" },
      { status: 500 }
    );
  }
}
