/**
 * Vendor Reviews API
 * GET /api/vendor/reviews — List all reviews for the vendor's products
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    const userRole = request.headers.get("X-User-Role");

    if (!userId || userRole !== "VENDOR") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Look up vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ratingFilter = searchParams.get("rating");
    const skip = (page - 1) * pageSize;

    const where: any = {
      product: { vendorId },
      isVisible: true,
    };
    if (ratingFilter) {
      where.rating = parseInt(ratingFilter);
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                select: { url: true },
                orderBy: { position: "asc" },
                take: 1,
              },
            },
          },
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.productReview.count({ where }),
    ]);

    // Aggregate stats
    const stats = await prisma.productReview.groupBy({
      by: ["rating"],
      where: { product: { vendorId }, isVisible: true },
      _count: { rating: true },
    });

    const ratingCounts = [1, 2, 3, 4, 5].reduce(
      (acc, r) => {
        acc[r] = stats.find((s) => s.rating === r)?._count.rating || 0;
        return acc;
      },
      {} as Record<number, number>
    );

    const totalReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
    const avgRating =
      totalReviews > 0
        ? Object.entries(ratingCounts).reduce(
            (sum, [r, count]) => sum + parseInt(r) * count,
            0
          ) / totalReviews
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
            image: r.product.images[0]?.url || null,
          },
          customer: {
            name:
              [r.customer.user.firstName, r.customer.user.lastName]
                .filter(Boolean)
                .join(" ") || "Anonymous",
          },
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          ratingCounts,
        },
      },
    });
  } catch (error) {
    console.error("Vendor reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
