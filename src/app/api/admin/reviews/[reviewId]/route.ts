/**
 * Admin Review Detail API
 * PATCH /api/admin/reviews/[reviewId] — Toggle visibility
 * DELETE /api/admin/reviews/[reviewId] — Delete review permanently
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const userRole = request.headers.get("X-User-Role");
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: { isVisible: !review.isVisible },
    });

    return NextResponse.json({
      success: true,
      data: { review: updated },
    });
  } catch (error) {
    console.error("Toggle review visibility error:", error);
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
    const userRole = request.headers.get("X-User-Role");
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
