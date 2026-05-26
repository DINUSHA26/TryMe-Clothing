import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
        isDisabledByAdmin: false,
      },
      include: {
        images: {
          select: { url: true, altText: true },
          orderBy: { position: "asc" },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            description: true,
            logo: true,
            user: {
              select: {
                id: true,
                isActive: true,
              },
            },
          },
        },
        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if vendor is active
    if (!product.vendor.user.isActive) {
      return NextResponse.json(
        { success: false, error: "Product not available" },
        { status: 404 }
      );
    }

    // Fetch visible reviews with customer info
    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id, isVisible: true },
      include: {
        customer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    // Get related products (same category, different product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        isDisabledByAdmin: false,
        vendor: {
        status: "ACTIVE",
          user: {
            isActive: true,
          },
        },
      },
      include: {
        images: {
          select: { url: true },
          orderBy: { position: "asc" },
          take: 3,
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
        variants: {
          select: { priceAdjustment: true, stock: true },
        },
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        product: {
          ...product,
          price: product.price.toNumber(),
          images: product.images.map((img) => img.url),
          variants: product.variants.map((v) => ({
            ...v,
            priceAdjustment: v.priceAdjustment ? v.priceAdjustment.toNumber() : null,
          })),
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount,
          reviews: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            customer: {
              user: {
                name:
                  [r.customer.user.firstName, r.customer.user.lastName]
                    .filter(Boolean)
                    .join(" ") || null,
              },
            },
          })),
        },
        relatedProducts: relatedProducts.map((p) => {
          const basePrice = p.price.toNumber();
          const hasVariants = p.variants.length > 0;
          const displayPrice = hasVariants
            ? Math.min(...p.variants.map((v) => basePrice + (v.priceAdjustment ? v.priceAdjustment.toNumber() : 0)))
            : basePrice;
          const totalStock = hasVariants
            ? p.variants.reduce((sum, v) => sum + v.stock, 0)
            : p.stock;

          // Calculate ratings for related product
          const pReviews = p.reviews || [];
          const pReviewCount = pReviews.length;
          const pAverageRating = pReviewCount > 0
            ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviewCount
            : 0;

          return {
            ...p,
            price: basePrice,
            displayPrice,
            totalStock,
            images: p.images.map((img) => img.url),
            variants: undefined,
            reviews: undefined,
            averageRating: Math.round(pAverageRating * 10) / 10,
            reviewCount: pReviewCount,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
