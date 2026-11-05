import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services
 * Public endpoint to list services published on TryMe Marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const priceType = searchParams.get("priceType");
    const sortBy = searchParams.get("sortBy") || "newest";

    const where: any = {
      isActive: true,
      isDisabledByAdmin: false,
      showOnMarketplace: true,
    };

    // Category / Subcategory filter
    if (categoryId && categoryId !== "all") {
      // Find whether categoryId is a Category or Subcategory
      const subMatch = await (prisma as any).serviceSubCategory.findUnique({
        where: { id: categoryId },
      });
      if (subMatch) {
        where.subCategoryId = subMatch.id;
      } else {
        where.categoryId = categoryId;
      }
    }

    if (subCategoryId && subCategoryId !== "all") {
      where.subCategoryId = subCategoryId;
    }

    // Text Search
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { subCategory: { name: { contains: q, mode: "insensitive" } } },
        { vendor: { businessName: { contains: q, mode: "insensitive" } } },
        { adsSeller: { businessName: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (priceType && priceType !== "all") {
      where.priceType = priceType;
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sortBy === "name-asc") {
      orderBy = { name: "asc" };
    } else if (sortBy === "sortOrder") {
      orderBy = { sortOrder: "asc" };
    }

    const [services, total] = await Promise.all([
      (prisma as any).websiteService.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true, image: true },
          },
          subCategory: {
            select: { id: true, name: true, slug: true, icon: true, image: true },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              logo: true,
              businessPhone: true,
              isShopOpen: true,
            },
          },
          adsSeller: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).websiteService.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching public services:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}
