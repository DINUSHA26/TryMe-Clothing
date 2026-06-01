import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

/**
 * DELETE /api/ads/seller/ads/[adId]
 * Delete a classified ad posted by the authenticated seller
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { adId } = await params;

    // Get seller profile
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Verify ownership of the ad
    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    if (ad.sellerId !== seller.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this ad" },
        { status: 403 }
      );
    }

    // Delete ad
    await prisma.classifiedAd.delete({
      where: { id: adId },
    });

    // Decrement adsUsed in active subscription
    const activeSub = seller.subscriptions[0];
    if (activeSub && activeSub.adsUsed > 0) {
      await prisma.adsSubscription.update({
        where: { id: activeSub.id },
        data: {
          adsUsed: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while deleting the ad" },
      { status: 500 }
    );
  }
}
