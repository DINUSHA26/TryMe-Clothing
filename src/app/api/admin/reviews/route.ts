/**
 * Admin Reviews API
 * GET /api/admin/reviews — List all reviews with moderation controls
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("X-User-Role");
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ratingFilter = searchParams.get("rating");
    const visibilityFilter = searchParams.get("visible"); // "true" | "false" | null
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (ratingFilter) where.rating = parseInt(ratingFilter);
    if (visibilityFilter !== null && visibilityFilter !== "")
      where.isVisible = visibilityFilter === "true";

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              vendor: {
                select: { businessName: true },
              },
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
                select: { firstName: true, lastName: true, email: true },
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

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          isVisible: r.isVisible,
          createdAt: r.createdAt.toISOString(),
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
            image: r.product.images[0]?.url || null,
            vendorName: r.product.vendor.businessName,
          },
          customer: {
            name:
              [r.customer.user.firstName, r.customer.user.lastName]
                .filter(Boolean)
                .join(" ") || "Anonymous",
            email: r.customer.user.email,
          },
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Admin reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
