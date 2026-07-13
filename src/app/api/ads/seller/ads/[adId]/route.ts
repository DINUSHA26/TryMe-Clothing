import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications/notificationService";

/**
 * GET /api/ads/seller/ads/[adId]
 * Fetch a specific ad for the seller to edit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { adId } = await params;

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("Error fetching seller ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching the ad" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ads/seller/ads/[adId]
 * Update an existing classified ad (retains current status, notifies admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { adId } = await params;
    const body = await request.json();

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const existingAd = await prisma.classifiedAd.findUnique({
      where: { id: adId },
    });

    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 }
      );
    }

    if (existingAd.sellerId !== seller.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this ad" },
        { status: 403 }
      );
    }

    // Update the ad
    const updatedAd = await prisma.classifiedAd.update({
      where: { id: adId },
      data: {
        categoryId: body.categoryId,
        subCategoryId: body.subCategoryId,
        title: body.title,
        description: body.description,
        price: body.price,
        priceNegotiable: body.priceNegotiable,
        condition: body.condition,
        images: body.images,
        district: body.district,
        localArea: body.localArea,
        specifications: body.specifications,
        // Status is NOT changed to PENDING, keeps existing status
      },
    });

    // Notify all super admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "SYSTEM_ANNOUNCEMENT", // Use SYSTEM_ANNOUNCEMENT as it works for admins
        title: "Classified Ad Edited",
        message: `Seller has edited the ad "${updatedAd.title}" (ID: ${updatedAd.id}). It remains active without re-approval.`,
        link: `/marketplace/${updatedAd.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedAd,
      message: "Ad updated successfully",
    });
  } catch (error) {
    console.error("Error updating seller ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while updating the ad" },
      { status: 500 }
    );
  }
}

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
