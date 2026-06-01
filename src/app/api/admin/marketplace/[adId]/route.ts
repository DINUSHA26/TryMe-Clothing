import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { emailService } from "@/lib/email";
import { AdStatus } from "@prisma/client";

/**
 * GET /api/admin/marketplace/[adId]
 * Get details of a single classified ad for admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const admin = requireAdmin(request);
    const { adId } = await params;

    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
      include: {
        category: true,
        subCategory: {
          include: {
            fieldDefinitions: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        seller: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Classified ad not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("Error fetching classified ad details:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching ad details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/marketplace/[adId]
 * Moderate an ad (approve, reject, make top ad)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const admin = requireAdmin(request);
    const { adId } = await params;
    const body = await request.json();

    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
      include: {
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Classified ad not found" },
        { status: 404 }
      );
    }

    const previousStatus = ad.status;
    const newStatus = body.status as AdStatus;

    const updatedAd = await prisma.classifiedAd.update({
      where: { id: adId },
      data: {
        ...(body.status && { status: newStatus }),
        ...(body.isTopAd !== undefined && { isTopAd: !!body.isTopAd }),
        ...(body.rejectionReason !== undefined && { rejectionReason: body.rejectionReason }),
        ...(body.adminNote !== undefined && { adminNote: body.adminNote }),
        ...(newStatus === "ACTIVE" && previousStatus !== "ACTIVE" && {
          publishedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Active for 30 days
        }),
      },
    });

    const sellerEmail = ad.seller.user.email!;
    const sellerName = ad.seller.businessName || `${ad.seller.user.firstName} ${ad.seller.user.lastName}`;

    // Send emails on status change
    if (newStatus === AdStatus.ACTIVE && previousStatus !== AdStatus.ACTIVE) {
      try {
        await emailService.sendAdApprovedEmail(sellerEmail, sellerName, ad.title, ad.id);
      } catch (err) {
        console.error("Error sending ad approved email:", err);
      }
    } else if (newStatus === AdStatus.REJECTED && previousStatus !== AdStatus.REJECTED) {
      try {
        await emailService.sendAdRejectedEmail(
          sellerEmail,
          sellerName,
          ad.title,
          body.rejectionReason || "Does not comply with terms."
        );
      } catch (err) {
        console.error("Error sending ad rejected email:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedAd,
    });
  } catch (error) {
    console.error("Error moderating classified ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while moderating the ad" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/marketplace/[adId]
 * Delete a classified ad (by admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const admin = requireAdmin(request);
    const { adId } = await params;

    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Classified ad not found" },
        { status: 404 }
      );
    }

    // Delete the ad
    await prisma.classifiedAd.delete({
      where: { id: adId },
    });

    return NextResponse.json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting classified ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while deleting the ad" },
      { status: 500 }
    );
  }
}
