import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category") || "";
    const subCategorySlug = searchParams.get("subCategory") || "";
    const district = searchParams.get("district") || "";
    const localArea = searchParams.get("localArea") || "";
    const isTopAd = searchParams.get("isTopAd");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    // Build the query where parameters
    const where: Prisma.ClassifiedAdWhereInput = {
      status: "ACTIVE", // Only show active/approved ads publicly
    };

    // Category filter by slug
    if (categorySlug) {
      const category = await prisma.adsCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    // Subcategory filter by slug
    if (subCategorySlug) {
      const subCategory = await prisma.adsSubCategory.findFirst({
        where: { slug: subCategorySlug },
      });
      if (subCategory) {
        where.subCategoryId = subCategory.id;
      }
    }

    // Location filters
    if (district && district !== "All of Sri Lanka") {
      where.district = district;
    }
    if (localArea) {
      where.localArea = localArea;
    }

    // Top ad promotion filter
    if (isTopAd !== null) {
      where.isTopAd = isTopAd === "true";
    }

    // Price range filters
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      };
    }

    // Specifications filters (any query param that is not a standard listing parameter)
    const standardKeys = [
      "search",
      "category",
      "subCategory",
      "district",
      "localArea",
      "isTopAd",
      "minPrice",
      "maxPrice",
      "sort",
      "page",
      "pageSize",
    ];

    const specsFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!standardKeys.includes(key)) {
        specsFilters[key] = value;
      }
    });

    if (Object.keys(specsFilters).length > 0) {
      const specsAnd = Object.entries(specsFilters).map(([key, value]) => ({
        specifications: {
          path: [key],
          equals: value,
        },
      }));
      where.AND = [...(where.AND as any[] || []), ...specsAnd];
    }

    // Search term matching in title/description or seller businessName
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          seller: {
            businessName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Build sort order
    let orderBy: Prisma.ClassifiedAdOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "popular") {
      orderBy = { views: "desc" };
    }

    // Get count
    const totalCount = await prisma.classifiedAd.count({ where });

    // Get ads
    const ads = await prisma.classifiedAd.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        category: {
          select: { name: true, slug: true, icon: true },
        },
        subCategory: {
          select: { name: true, slug: true },
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ads,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public ads:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while loading marketplace ads" },
      { status: 500 }
    );
  }
}
