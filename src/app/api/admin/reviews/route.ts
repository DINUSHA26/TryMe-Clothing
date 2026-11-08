/**
 * Admin Reviews API
 * GET /api/admin/reviews — List all reviews (TryMe Marketplace & Vendor Websites) with moderation controls
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "all"; // "all" | "tryme" | "website"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));
    const ratingFilter = searchParams.get("rating");
    const visibilityFilter = searchParams.get("visible"); // "true" | "false" | "all" | null
    const vendorIdFilter = searchParams.get("vendorId");
    const skip = (page - 1) * pageSize;

    // 1. Fetch TryMe Marketplace Reviews & Active Vendors concurrently
    const [trymeReviewsRaw, websiteConfigs, vendorsList] = await Promise.all([
      prisma.productReview.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              vendor: {
                select: { id: true, businessName: true, slug: true },
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
      }),
      (prisma as any).vendorWebsiteConfig.findMany({
        where: {
          reviewsSection: { not: null },
        },
        select: {
          id: true,
          reviewsSection: true,
          vendor: {
            select: { id: true, businessName: true, slug: true },
          },
          adsSeller: {
            select: { id: true, businessName: true, slug: true },
          },
        },
      }),
      prisma.vendor.findMany({
        select: {
          id: true,
          businessName: true,
          slug: true,
        },
        orderBy: {
          businessName: "asc",
        },
      }),
    ]);

    // 2. Format TryMe Marketplace Reviews
    const formattedTrymeReviews = trymeReviewsRaw.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isVisible: r.isVisible,
      createdAt: r.createdAt.toISOString(),
      source: "TRYME_MARKETPLACE" as const,
      vendorReply: null,
      vendorId: r.product?.vendor?.id || "",
      product: {
        id: r.product?.id || "",
        name: r.product?.name || "Product",
        slug: r.product?.slug || "",
        image: r.product?.images?.[0]?.url || null,
        vendorName: r.product?.vendor?.businessName || "TryMe Vendor",
      },
      customer: {
        name:
          [r.customer?.user?.firstName, r.customer?.user?.lastName]
            .filter(Boolean)
            .join(" ") || "Customer",
        email: r.customer?.user?.email || null,
      },
    }));

    // 3. Format Vendor Website Reviews
    const formattedWebsiteReviews: any[] = [];
    for (const cfg of websiteConfigs) {
      const sec = cfg.reviewsSection || {};
      const webRevs: any[] = Array.isArray(sec.websiteReviews) ? sec.websiteReviews : [];
      const storeName = cfg.vendor?.businessName || cfg.adsSeller?.businessName || "Vendor Website";
      const storeVendorId = cfg.vendor?.id || cfg.adsSeller?.id || "";

      for (const wr of webRevs) {
        formattedWebsiteReviews.push({
          id: wr.id,
          rating: Number(wr.rating) || 5,
          comment: wr.comment || "",
          isVisible: wr.isVisible !== false,
          createdAt: wr.createdAt ? new Date(wr.createdAt).toISOString() : new Date().toISOString(),
          source: "VENDOR_WEBSITE" as const,
          vendorReply: wr.vendorReply || null,
          vendorId: storeVendorId,
          product: {
            id: wr.itemId || "",
            name: wr.itemName || "Store Product",
            slug: wr.productSlug || "",
            image: wr.itemImage || null,
            vendorName: storeName,
          },
          customer: {
            name: wr.customerName || "Customer",
            email: wr.customerEmail || null,
          },
        });
      }
    }

    // 4. Channel Counts (All un-filtered by rating/visibility)
    const channelCounts = {
      all: formattedTrymeReviews.length + formattedWebsiteReviews.length,
      tryme: formattedTrymeReviews.length,
      website: formattedWebsiteReviews.length,
    };

    // 5. Combine & Filter
    let combined =
      source === "tryme"
        ? formattedTrymeReviews
        : source === "website"
        ? formattedWebsiteReviews
        : [...formattedTrymeReviews, ...formattedWebsiteReviews];

    if (ratingFilter && ratingFilter !== "all") {
      const rNum = parseInt(ratingFilter);
      combined = combined.filter((r) => r.rating === rNum);
    }

    if (visibilityFilter && visibilityFilter !== "all") {
      const isVis = visibilityFilter === "true";
      combined = combined.filter((r) => r.isVisible === isVis);
    }

    if (vendorIdFilter && vendorIdFilter !== "all") {
      combined = combined.filter((r) => r.vendorId === vendorIdFilter);
    }

    // Sort newest first
    combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = combined.length;
    const paged = combined.slice(skip, skip + pageSize);

    return NextResponse.json({
      success: true,
      data: {
        reviews: paged,
        channelCounts,
        vendors: vendorsList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Reviews API] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
