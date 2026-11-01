import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandaloneSiteData } from "@/lib/site-resolver";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteData(domainOrSlug);
    if (!siteData) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    let reviews: any[] = Array.isArray((siteData.config?.reviewsSection as any)?.websiteReviews)
      ? (siteData.config?.reviewsSection as any).websiteReviews.filter(
          (r: any) => r.isVisible !== false
        )
      : [];

    if (itemId) {
      reviews = reviews.filter((r: any) => r.itemId === itemId || r.productSlug === itemId);
    }

    return NextResponse.json({
      success: true,
      data: { reviews },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteData(domainOrSlug);

    if (!siteData || !siteData.config?.id) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      rating,
      comment,
      itemId,
      itemName,
      itemImage,
      itemType,
      productSlug,
    } = body;

    if (!customerName?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your name and review comment" },
        { status: 400 }
      );
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));

    const newReview = {
      id: `webrev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail?.trim() || "",
      rating: numericRating,
      comment: comment.trim(),
      itemId: itemId || null,
      itemName: itemName || "Store Experience",
      itemImage: itemImage || null,
      itemType: itemType || "PRODUCT",
      productSlug: productSlug || null,
      source: "VENDOR_WEBSITE",
      isVisible: true,
      isFeatured: false,
      vendorReply: null,
      createdAt: new Date().toISOString(),
    };

    const existingReviewsSection = (siteData.config.reviewsSection as any) || {
      enabled: true,
      title: "What Our Customers Say",
      items: [],
    };
    const existingWebsiteReviews = Array.isArray(existingReviewsSection.websiteReviews)
      ? existingReviewsSection.websiteReviews
      : [];

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: siteData.config.id },
      data: {
        reviewsSection: {
          ...existingReviewsSection,
          websiteReviews: [newReview, ...existingWebsiteReviews],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newReview,
    });
  } catch (error: any) {
    console.error("Error submitting website review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}

