import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const vendorId = searchParams.get("vendorId") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const inStock = searchParams.get("inStock") === "true";
    const productIds = searchParams.getAll("id").filter(Boolean);

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      isDisabledByAdmin: false,
      vendor: {
        status: "ACTIVE",
        user: {
          isActive: true,
        },
      },
    };

    // Search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by category (including subcategories)
    if (categoryId) {
      where.OR = [
        { categoryId },
        { category: { parentId: categoryId } },
      ];
    }

    const size = searchParams.getAll("size").filter(Boolean);
    const color = searchParams.getAll("color").filter(Boolean);
    const brandIds = searchParams.getAll("brandId").filter(Boolean); // Aliasing vendor to brand in the UI
    const vendorIds = [...searchParams.getAll("vendorId").filter(Boolean), ...brandIds];

    // Filter by vendor / brand
    if (vendorIds.length > 0) {
      where.vendorId = { in: vendorIds };
    }

    // Filter by specific IDs (e.g. for wishlist)
    if (productIds.length > 0) {
      where.id = { in: productIds };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Filter by stock availability
    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Filter by variants (Size, Color)
    if (size.length > 0 || color.length > 0) {
      const variantFilters: Prisma.ProductVariantListRelationFilter = { some: {} };
      if (size.length > 0) {
        variantFilters.some = { ...variantFilters.some, name: { equals: "Size", mode: "insensitive" }, value: { in: size } };
      }
      if (color.length > 0) {
        // If both size and color are selected, we want products that have BOTH a matching size variant AND a matching color variant.
        // Wait, some means AT LEAST ONE variant matches. If they select Size XL and Color Red, the product just needs any variant matching Size XL or Color Red?
        // Let's implement it as AND at the product level: product has a size XL variant, AND product has a color Red variant.
      }

      where.AND = [
        ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      ];

      if (size.length > 0) {
        (where.AND as any[]).push({
          variants: { some: { name: { equals: "Size", mode: "insensitive" }, value: { in: size } } }
        });
      }
      if (color.length > 0) {
        (where.AND as any[]).push({
          variants: { some: { name: { equals: "Color", mode: "insensitive" }, value: { in: color } } }
        });
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};

    // Map sort codes to Prisma orderBy
    switch (sortBy) {
      case "price-asc":
        orderBy.price = "asc";
        break;
      case "price-desc":
        orderBy.price = "desc";
        break;
      case "name-asc":
      case "alphabetical-asc":
        orderBy.name = "asc";
        break;
      case "name-desc":
      case "alphabetical-desc":
        orderBy.name = "desc";
        break;
      case "date-asc":
      case "createdAt-asc":
        orderBy.createdAt = "asc";
        break;
      case "date-desc":
      case "createdAt-desc":
      case "featured":
      case "best-selling":
        orderBy.createdAt = "desc";
        break;
      default:
        // Handle old legacy parameters if still sent
        if (sortBy === "price") {
          orderBy.price = sortOrder as "asc" | "desc";
        } else if (sortBy === "name") {
          orderBy.name = sortOrder as "asc" | "desc";
        } else {
          orderBy.createdAt = sortOrder as "asc" | "desc";
        }
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            select: { url: true },
            orderBy: { position: "asc" },
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
              user: {
                select: {
                  id: true,
                },
              },
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Flatten images, compute display price and total stock for variant products
    const productsWithRatings = products.map((product) => {
      const basePrice = product.price.toNumber();
      const hasVariants = product.variants.length > 0;
      // Minimum absolute price across all variants
      const displayPrice = hasVariants
        ? Math.min(...product.variants.map((v) => basePrice + (v.priceAdjustment ? v.priceAdjustment.toNumber() : 0)))
        : basePrice;
      // Total stock across all variants (or base stock for simple products)
      const totalStock = hasVariants
        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
        : product.stock;

      // Calculate ratings
      const reviews = product.reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      return {
        ...product,
        price: basePrice,
        displayPrice,
        totalStock,
        hasVariants,
        images: product.images.map((img) => img.url),
        variants: undefined, // don't expose raw variants to card
        reviews: undefined, // don't expose raw reviews to card
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
