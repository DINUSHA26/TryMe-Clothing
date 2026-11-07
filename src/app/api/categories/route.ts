import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisHelpers } from "@/lib/redis";

// In-memory cache fallback (TTL 120s)
let memoryCategoriesCache: { data: any; exp: number } | null = null;
const CACHE_TTL_SECONDS = 120;

/**
 * GET /api/categories
 * Public endpoint - Get active categories (for storefront & vendor selectors)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const ids = searchParams.get("ids")?.split(",");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Fast path: cached full active category hierarchy (most frequent query)
    const isDefaultQuery = !ids && !searchParams.has("parentId") && !includeInactive;
    if (isDefaultQuery) {
      // 1. Check in-memory cache first (0ms)
      if (memoryCategoriesCache && memoryCategoriesCache.exp > Date.now()) {
        return NextResponse.json(
          { success: true, data: { categories: memoryCategoriesCache.data } },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
              "X-Cache": "MEMORY",
            },
          }
        );
      }

      // 2. Check Redis cache (1-2ms)
      try {
        const cached = await redisHelpers.get("cache:categories:all");
        if (cached) {
          const parsed = JSON.parse(cached);
          memoryCategoriesCache = { data: parsed, exp: Date.now() + CACHE_TTL_SECONDS * 1000 };
          return NextResponse.json(
            { success: true, data: { categories: parsed } },
            {
              headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                "X-Cache": "REDIS",
              },
            }
          );
        }
      } catch {
        // Redis error/missing: fall through to database
      }
    }

    // Build where clause
    const where: any = {
      ...(includeInactive ? {} : { isActive: true }),
    };

    // If ids are specified
    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    // If parentId is specified (including null for root categories)
    else if (searchParams.has("parentId")) {
      where.parentId = parentId === "null" || parentId === null ? null : parentId;
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            parentId: true,
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true,
                    isDisabledByAdmin: false,
                  },
                },
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDisabledByAdmin: false,
              },
            },
          },
        },
      },
    });

    const categoriesWithCount = categories.map((cat) => {
      let subcategoryProductsCount = 0;
      if (cat.children && cat.children.length > 0) {
        subcategoryProductsCount = cat.children.reduce(
          (sum, child: any) => sum + (child._count?.products || 0),
          0
        );
      }
      return {
        ...cat,
        children: cat.children.map((child: any) => {
          const { _count, ...rest } = child;
          return rest;
        }),
        _count: {
          products: (cat._count?.products || 0) + subcategoryProductsCount,
        },
      };
    });

    // Populate cache for default queries
    if (isDefaultQuery) {
      memoryCategoriesCache = {
        data: categoriesWithCount,
        exp: Date.now() + CACHE_TTL_SECONDS * 1000,
      };
      redisHelpers
        .setWithExpiry("cache:categories:all", JSON.stringify(categoriesWithCount), CACHE_TTL_SECONDS)
        .catch(() => undefined);
    }

    return NextResponse.json(
      {
        success: true,
        data: { categories: categoriesWithCount },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching categories",
      },
      { status: 500 }
    );
  }
}
