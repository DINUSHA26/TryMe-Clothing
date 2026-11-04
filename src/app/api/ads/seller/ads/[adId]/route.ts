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
    const updateData: any = {};
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.subCategoryId !== undefined) updateData.subCategoryId = body.subCategoryId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.priceNegotiable !== undefined) updateData.priceNegotiable = body.priceNegotiable;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.localArea !== undefined) updateData.localArea = body.localArea;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.showOnWebsite !== undefined) updateData.showOnWebsite = !!body.showOnWebsite;
    if (body.showOnMarketplace !== undefined) updateData.showOnMarketplace = !!body.showOnMarketplace;

    const updatedAd = await prisma.classifiedAd.update({
      where: { id: adId },
      data: updateData,
    });

    // Notify all super admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "SYSTEM_ANNOUNCEMENT" as any, // Use SYSTEM_ANNOUNCEMENT as it works for admins
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
/**
 * PATCH /api/ads/seller/ads/[adId]
 * Partially update classified ad (e.g. toggle showOnWebsite / showOnMarketplace)
 */
export async function PATCH(
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

    const updateData: any = {};
    if (body.showOnWebsite !== undefined) updateData.showOnWebsite = Boolean(body.showOnWebsite);
    if (body.showOnMarketplace !== undefined) updateData.showOnMarketplace = Boolean(body.showOnMarketplace);
    if (body.status !== undefined && ["ACTIVE", "PAUSED"].includes(body.status) && existingAd.status !== "PENDING" && existingAd.status !== "REJECTED") {
      updateData.status = body.status;
    }

    const updatedAd = await prisma.classifiedAd.update({
      where: { id: adId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedAd,
      message: "Ad channel visibility updated successfully",
    });
  } catch (error) {
    console.error("Error patching seller ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while updating the ad" },
      { status: 500 }
    );
  }
}

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
