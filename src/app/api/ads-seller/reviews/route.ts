import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/reviews
 * List reviews for Ads Seller (TryMe Marketplace vs Storefront Website)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const seller = await (prisma as any).adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
    const vendorId = sellerVendor?.vendor.id;

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "tryme"; // "tryme" | "website"
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ratingFilter = searchParams.get("rating");
    const skip = (page - 1) * pageSize;

    // 1. Fetch Website Reviews from VendorWebsiteConfig
    let websiteConfig = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: {
        OR: [
          { adsSellerId: seller.id },
          ...(vendorId ? [{ vendorId }] : []),
        ],
      },
      select: { id: true, reviewsSection: true },
    });

    const websiteReviewsAll: any[] = Array.isArray(
      websiteConfig?.reviewsSection?.websiteReviews
    )
      ? websiteConfig.reviewsSection.websiteReviews
      : [];

    // 2. Count Marketplace Reviews
    const trymeTotalCount = vendorId
      ? await prisma.productReview.count({
          where: { product: { vendorId }, isVisible: true },
        })
      : 0;

    const channelCounts = {
      tryme: trymeTotalCount,
      website: websiteReviewsAll.length,
    };

    if (source === "website") {
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
              name: r.itemName || "Storefront Review",
              slug: r.productSlug || "",
              image: r.itemImage || null,
              itemType: r.itemType || "PRODUCT",
            },
            customer: {
              name: r.customerName || "Customer",
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

    // Default: TryMe Marketplace Reviews
    const where: any = {
      product: { vendorId },
      isVisible: true,
    };
    if (ratingFilter && ratingFilter !== "all") {
      where.rating = parseInt(ratingFilter);
    }

    const [reviews, total] = await Promise.all([
      vendorId
        ? prisma.productReview.findMany({
            where,
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
                },
              },
              customer: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          })
        : [],
      vendorId ? prisma.productReview.count({ where }) : 0,
    ]);

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (vendorId) {
      const allRatings = await prisma.productReview.findMany({
        where: { product: { vendorId }, isVisible: true },
        select: { rating: true },
      });
      allRatings.forEach((r) => {
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      });
    }

    const totalReviews = total;
    const sumRatings = Object.entries(ratingCounts).reduce(
      (sum, [star, count]) => sum + parseInt(star) * count,
      0
    );
    const avgRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

    return NextResponse.json({
      success: true,
      data: {
        channelCounts,
        reviews: reviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          isVisible: r.isVisible,
          source: "tryme",
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
            image: r.product.images[0]?.url || null,
          },
          customer: {
            name: `${r.customer.user.firstName || "Customer"} ${r.customer.user.lastName || ""}`.trim(),
            avatar: r.customer.user.avatar || null,
          },
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        stats: {
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          ratingCounts,
        },
      },
    });
  } catch (error: any) {
    console.error("Error listing ads seller reviews:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch reviews" }, { status: 500 });
  }
}

/**
 * POST /api/ads-seller/reviews
 * Add verified website review / testimonial
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const seller = await (prisma as any).adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const body = await request.json();
    const { customerName, rating = 5, comment = "", itemName = "Store Review", itemImage = null } = body;

    if (!customerName || !comment) {
      return NextResponse.json({ success: false, error: "Customer name and comment are required" }, { status: 400 });
    }

    let config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: { adsSellerId: seller.id },
    });

    if (!config) {
      config = await (prisma as any).vendorWebsiteConfig.create({
        data: {
          adsSellerId: seller.id,
          reviewsSection: { websiteReviews: [] },
        },
      });
    }

    const currentSection = (typeof config.reviewsSection === "object" && config.reviewsSection) || {};
    const reviews = Array.isArray(currentSection.websiteReviews) ? [...currentSection.websiteReviews] : [];

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      customerName: customerName.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      itemName: itemName.trim(),
      itemImage,
      createdAt: new Date().toISOString(),
      isVisible: true,
      isFeatured: false,
    };

    reviews.unshift(newReview);

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: config.id },
      data: {
        reviewsSection: {
          ...currentSection,
          websiteReviews: reviews,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    });
  } catch (error: any) {
    console.error("Error creating website review:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to create review" }, { status: 500 });
  }
}

/**
 * PATCH /api/ads-seller/reviews
 * Update review visibility, feature, reply, or delete
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const seller = await (prisma as any).adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, reviewId, replyText } = body;

    const config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: { adsSellerId: seller.id },
    });

    if (!config) {
      return NextResponse.json({ success: false, error: "Website config not found" }, { status: 404 });
    }

    const currentSection = (typeof config.reviewsSection === "object" && config.reviewsSection) || {};
    let reviews: any[] = Array.isArray(currentSection.websiteReviews) ? [...currentSection.websiteReviews] : [];

    const revIdx = reviews.findIndex((r) => r.id === reviewId);
    if (revIdx === -1) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    if (action === "toggle_visibility") {
      reviews[revIdx].isVisible = !reviews[revIdx].isVisible;
    } else if (action === "toggle_feature") {
      reviews[revIdx].isFeatured = !reviews[revIdx].isFeatured;
    } else if (action === "reply") {
      reviews[revIdx].vendorReply = replyText?.trim() || "";
      reviews[revIdx].repliedAt = new Date().toISOString();
    } else if (action === "delete") {
      reviews = reviews.filter((r) => r.id !== reviewId);
    }

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: config.id },
      data: {
        reviewsSection: {
          ...currentSection,
          websiteReviews: reviews,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      data: reviews[revIdx] || null,
    });
  } catch (error: any) {
    console.error("Error updating review:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to update review" }, { status: 500 });
  }
}

