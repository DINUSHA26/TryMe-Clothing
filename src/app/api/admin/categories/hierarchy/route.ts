import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategoryWithChildren } from "@/types/category";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

// Helper: Build category tree recursively
async function buildCategoryTree(
  parentId: string | null = null
): Promise<CategoryWithChildren[]> {
  const categories = await prisma.category.findMany({
    where: { parentId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  // Recursively get children for each category
  const categoriesWithChildren: CategoryWithChildren[] = await Promise.all(
    categories.map(async (category) => {
      const children = await buildCategoryTree(category.id);
      const subcategoryProductsCount = children.reduce(
        (sum, child) => sum + (child._count?.products || 0),
        0
      );
      return {
        ...category,
        _count: {
          products: (category._count?.products || 0) + subcategoryProductsCount,
        },
        children: children.length > 0 ? children : undefined,
      };
    })
  );

  return categoriesWithChildren;
}

/**
 * GET /api/admin/categories/hierarchy
 * Get category tree structure
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Build tree starting from root categories (parentId = null)
    const tree = await buildCategoryTree(null);

    return NextResponse.json({
      success: true,
      data: { tree },
    });
  } catch (error) {
    console.error("Error fetching category hierarchy:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching the category hierarchy",
      },
      { status: 500 }
    );
  }
}
