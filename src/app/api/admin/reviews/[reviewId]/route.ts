/**
 * Admin Review Detail API
 * PATCH /api/admin/reviews/[reviewId] — Toggle visibility (TryMe or Vendor Website)
 * DELETE /api/admin/reviews/[reviewId] — Delete review permanently (TryMe or Vendor Website)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    requireAdmin(request);

    const { reviewId } = await params;

    // 1. Try to find in ProductReview
    const productReview = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (productReview) {
      const updated = await prisma.productReview.update({
        where: { id: reviewId },
        data: { isVisible: !productReview.isVisible },
      });

      return NextResponse.json({
        success: true,
        data: { review: updated },
      });
    }

    // 2. If not in ProductReview, search vendorWebsiteConfig for website review
    const websiteConfigs = await (prisma as any).vendorWebsiteConfig.findMany({
      where: { reviewsSection: { not: null } },
      select: { id: true, reviewsSection: true },
    });

    for (const cfg of websiteConfigs) {
      const section = cfg.reviewsSection || {};
      const webRevs: any[] = Array.isArray(section.websiteReviews) ? [...section.websiteReviews] : [];
      const foundIdx = webRevs.findIndex((r) => r.id === reviewId);

      if (foundIdx !== -1) {
        const currentVisibility = webRevs[foundIdx].isVisible !== false;
        webRevs[foundIdx] = {
          ...webRevs[foundIdx],
          isVisible: !currentVisibility,
        };

        // Also update featured items if needed
        const featuredItems = webRevs
          .filter((r) => r.isVisible !== false && r.isFeatured)
          .map((r) => ({
            id: r.id,
            name: r.customerName,
            comment: r.comment,
            rating: r.rating || 5,
          }));

        await (prisma as any).vendorWebsiteConfig.update({
          where: { id: cfg.id },
          data: {
            reviewsSection: {
              ...section,
              websiteReviews: webRevs,
              ...(featuredItems.length > 0 ? { items: featuredItems } : {}),
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: { review: webRevs[foundIdx] },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "Review not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[Admin Reviews PATCH] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    requireAdmin(request);

    const { reviewId } = await params;

    // 1. Try to find in ProductReview
    const productReview = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (productReview) {
      await prisma.productReview.delete({
        where: { id: reviewId },
      });

      return NextResponse.json({ success: true });
    }

    // 2. If not in ProductReview, search vendorWebsiteConfig
    const websiteConfigs = await (prisma as any).vendorWebsiteConfig.findMany({
      where: { reviewsSection: { not: null } },
      select: { id: true, reviewsSection: true },
    });

    for (const cfg of websiteConfigs) {
      const section = cfg.reviewsSection || {};
      const webRevs: any[] = Array.isArray(section.websiteReviews) ? [...section.websiteReviews] : [];
      const foundIdx = webRevs.findIndex((r) => r.id === reviewId);

      if (foundIdx !== -1) {
        const updated = webRevs.filter((r) => r.id !== reviewId);

        const featuredItems = updated
          .filter((r) => r.isVisible !== false && r.isFeatured)
          .map((r) => ({
            id: r.id,
            name: r.customerName,
            comment: r.comment,
            rating: r.rating || 5,
          }));

        await (prisma as any).vendorWebsiteConfig.update({
          where: { id: cfg.id },
          data: {
            reviewsSection: {
              ...section,
              websiteReviews: updated,
              ...(featuredItems.length > 0 ? { items: featuredItems } : {}),
            },
          },
        });

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json(
      { success: false, error: "Review not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[Admin Reviews DELETE] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
