/**
 * Vendor Reviews API
 * GET /api/vendor/reviews — List reviews separated by channel (TryMe.lk Marketplace vs Vendor Website)
 * POST /api/vendor/reviews — Add a verified website review / testimonial
 * PATCH /api/vendor/reviews — Manage website reviews (approve/hide, feature, reply, delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, getEffectiveVendor } from "@/lib/auth-helpers";

async function resolveVendor(request: NextRequest) {
  let userId = request.headers.get("X-User-Id");
  if (!userId) {
    userId = getAuthUser(request)?.userId || null;
  }
  if (!userId) return null;

  const effective = await getEffectiveVendor(userId);
  return effective?.vendor || null;
}

export async function GET(request: NextRequest) {
  try {
    const vendorRecord = await resolveVendor(request);
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Unauthorized or vendor not found" },
        { status: 401 }
      );
    }
    const vendorId = vendorRecord.id;

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "tryme"; // "tryme" | "website"
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ratingFilter = searchParams.get("rating");
    const skip = (page - 1) * pageSize;

    // 1. Fetch Website Config to get Website Reviews
    const websiteConfig = await (prisma as any).vendorWebsiteConfig.findUnique({
      where: { vendorId },
      select: { id: true, reviewsSection: true },
    });

    const websiteReviewsAll: any[] = Array.isArray(
      websiteConfig?.reviewsSection?.websiteReviews
    )
      ? websiteConfig.reviewsSection.websiteReviews
      : [];

    // 2. Count TryMe Marketplace Reviews
    const trymeTotalCount = await prisma.productReview.count({
      where: {
        product: { vendorId },
        isVisible: true,
      },
    });

    const channelCounts = {
      tryme: trymeTotalCount,
      website: websiteReviewsAll.length,
    };

    if (source === "website") {
      // Filter website reviews
      let filtered = [...websiteReviewsAll];
      if (ratingFilter && ratingFilter !== "all") {
        const rNum = parseInt(ratingFilter);
        filtered = filtered.filter((r) => Number(r.rating) === rNum);
      }

      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      websiteReviewsAll.forEach((r) => {
        const rt = Math.min(5, Math.max(1, Number(r.rating) || 5));
        ratingCounts[rt] = (ratingCounts[rt] || 0) + 1;
      });

      const totalReviews = websiteReviewsAll.length;
      const avgRating =
        totalReviews > 0
          ? websiteReviewsAll.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
            totalReviews
          : 0;

      const paged = filtered.slice(skip, skip + pageSize);

      return NextResponse.json({
        success: true,
        data: {
          channelCounts,
          reviews: paged.map((r) => ({
            id: r.id,
            rating: Number(r.rating) || 5,
            comment: r.comment || "",
            createdAt: r.createdAt || new Date().toISOString(),
            isVisible: r.isVisible !== false,
            isFeatured: Boolean(r.isFeatured),
            vendorReply: r.vendorReply || null,
            source: "VENDOR_WEBSITE",
            product: {
              id: r.itemId || "store",
              name: r.itemName || "Website Store Review",
              slug: r.productSlug || "",
              image: r.itemImage || null,
              itemType: r.itemType || "PRODUCT",
            },
            customer: {
              name: r.customerName || "Website Customer",
              email: r.customerEmail || "",
            },
          })),
          pagination: {
            page,
            pageSize,
            total: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
          },
          stats: {
            totalReviews,
            avgRating: Math.round(avgRating * 10) / 10,
            ratingCounts,
          },
        },
      });
    }

    // Default: TryMe.lk Marketplace Reviews
    const where: any = {
      product: { vendorId },
      isVisible: true,
    };
    if (ratingFilter && ratingFilter !== "all") {
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
        channelCounts,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          isVisible: r.isVisible,
          source: "TRYME_MARKETPLACE",
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

export async function POST(request: NextRequest) {
  try {
    const vendorRecord = await resolveVendor(request);
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { customerName, rating, comment, itemName, itemId, productSlug } = body;

    if (!customerName?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name and review comment are required" },
        { status: 400 }
      );
    }

    let config = await (prisma as any).vendorWebsiteConfig.findUnique({
      where: { vendorId: vendorRecord.id },
    });

    if (!config) {
      config = await (prisma as any).vendorWebsiteConfig.create({
        data: {
          vendorId: vendorRecord.id,
          reviewsSection: { enabled: true, title: "What Our Customers Say", items: [], websiteReviews: [] },
        },
      });
    }

    const existingReviewsSection = (config.reviewsSection as any) || {
      enabled: true,
      title: "What Our Customers Say",
      items: [],
    };
    const existingWebsiteReviews = Array.isArray(existingReviewsSection.websiteReviews)
      ? existingReviewsSection.websiteReviews
      : [];

    const newReview = {
      id: `webrev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: customerName.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      itemId: itemId || null,
      itemName: itemName || vendorRecord.businessName,
      productSlug: productSlug || null,
      source: "VENDOR_WEBSITE",
      isVisible: true,
      isFeatured: true,
      vendorReply: null,
      createdAt: new Date().toISOString(),
    };

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: config.id },
      data: {
        reviewsSection: {
          ...existingReviewsSection,
          enabled: true,
          websiteReviews: [newReview, ...existingWebsiteReviews],
        },
      },
    });

    return NextResponse.json({ success: true, data: newReview });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add review" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const vendorRecord = await resolveVendor(request);
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const config = await (prisma as any).vendorWebsiteConfig.findUnique({
      where: { vendorId: vendorRecord.id },
    });
    if (!config) {
      return NextResponse.json({ success: false, error: "Website config not found" }, { status: 404 });
    }

    const body = await request.json();
    const { reviewId, action, isVisible, isFeatured, vendorReply } = body;

    const existingReviewsSection = (config.reviewsSection as any) || {};
    const existingWebsiteReviews: any[] = Array.isArray(existingReviewsSection.websiteReviews)
      ? existingReviewsSection.websiteReviews
      : [];

    let updatedReviews: any[];
    if (action === "DELETE") {
      updatedReviews = existingWebsiteReviews.filter((r) => r.id !== reviewId);
    } else {
      updatedReviews = existingWebsiteReviews.map((r) => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          ...(typeof isVisible === "boolean" ? { isVisible } : {}),
          ...(typeof isFeatured === "boolean" ? { isFeatured } : {}),
          ...(vendorReply !== undefined ? { vendorReply } : {}),
        };
      });
    }

    // Also sync featured website reviews into reviewsSection.items so the website home page displays them
    const featuredItems = updatedReviews
      .filter((r) => r.isVisible !== false && r.isFeatured)
      .map((r) => ({
        id: r.id,
        name: r.customerName,
        comment: r.comment,
        rating: r.rating || 5,
      }));

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: config.id },
      data: {
        reviewsSection: {
          ...existingReviewsSection,
          websiteReviews: updatedReviews,
          ...(featuredItems.length > 0 ? { items: featuredItems, enabled: true } : {}),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}
