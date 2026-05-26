import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/categories
 * Public endpoint - Get active categories (for storefront)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const ids = searchParams.get("ids")?.split(",");
    const includeInactive = searchParams.get("includeInactive") === "true";

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

    return NextResponse.json({
      success: true,
      data: { categories: categoriesWithCount },
    });
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
