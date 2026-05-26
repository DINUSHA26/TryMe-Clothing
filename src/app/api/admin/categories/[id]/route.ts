import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { updateCategorySchema } from "@/lib/validations/category";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Helper: Check category depth (max 2 levels)
async function getCategoryDepth(categoryId: string): Promise<number> {
  let depth = 0;
  let currentId: string | null = categoryId;

  while (currentId) {
    const category: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!category) break;

    depth++;
    currentId = category.parentId;

    if (depth > 2) break; // Prevent infinite loops
  }

  return depth;
}

/**
 * GET /api/admin/categories/[id]
 * Get category details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Get category with related data
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    const subcategoryProductsCount = category.children.reduce(
      (sum, child: any) => sum + (child._count?.products || 0),
      0
    );

    const categoryWithCount = {
      ...category,
      children: category.children.map((child: any) => {
        const { _count, ...rest } = child;
        return rest;
      }),
      _count: {
        products: (category._count?.products || 0) + subcategoryProductsCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: { category: categoryWithCount },
    });
  } catch (error) {
    console.error("Error fetching category:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching the category",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/categories/[id]
 * Update category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If parentId is being changed, validate depth limit
    if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
      if (data.parentId) {
        // Check if new parent would exceed depth
        const parentDepth = await getCategoryDepth(data.parentId);

        if (parentDepth >= 2) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Maximum category depth reached. Categories can only have one level of children.",
            },
            { status: 400 }
          );
        }

        // Check if trying to set self or child as parent (circular reference)
        if (data.parentId === id) {
          return NextResponse.json(
            {
              success: false,
              error: "A category cannot be its own parent",
            },
            { status: 400 }
          );
        }

        // Check if this category has children - if so, can't become a child itself
        const hasChildren = await prisma.category.count({
          where: { parentId: id },
        });

        if (hasChildren > 0) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Cannot set parent for a category that has children. Maximum depth is 2 levels.",
            },
            { status: 400 }
          );
        }

        // Verify parent exists
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          return NextResponse.json(
            {
              success: false,
              error: "Parent category not found",
            },
            { status: 404 }
          );
        }
      }
    }

    // If name is being changed, generate new slug
    let slug = existingCategory.slug;
    if (data.name && data.name !== existingCategory.name) {
      const baseSlug = data.slug || generateSlug(data.name);
      slug = await generateUniqueSlug(baseSlug, async (slug) => {
        if (slug === existingCategory.slug) return false; // Same slug is okay
        const existing = await prisma.category.findUnique({ where: { slug } });
        return !!existing;
      });
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.name && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    const subcategoryProductsCount = category.children.reduce(
      (sum, child: any) => sum + (child._count?.products || 0),
      0
    );

    const categoryWithCount = {
      ...category,
      children: undefined, // remove children to match expected type of update response
      _count: {
        products: (category._count?.products || 0) + subcategoryProductsCount,
        children: category._count?.children || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: { category: categoryWithCount },
    });
  } catch (error) {
    console.error("Error updating category:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the category",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete category (with constraint checks)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Use transaction to check constraints and delete
    await prisma.$transaction(async (tx) => {
      // Check if category exists
      const category = await tx.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // Check for children
      const childCount = await tx.category.count({
        where: { parentId: id },
      });

      if (childCount > 0) {
        throw new Error(
          `Cannot delete category with ${childCount} subcategor${childCount === 1 ? "y" : "ies"}. Please delete or reassign subcategories first.`
        );
      }

      // Check for products
      const productCount = await tx.product.count({
        where: { categoryId: id },
      });

      if (productCount > 0) {
        throw new Error(
          `Cannot delete category with ${productCount} product${productCount === 1 ? "" : "s"}. Please reassign or delete products first.`
        );
      }

      // Safe to delete
      await tx.category.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Category deleted successfully",
      },
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    // Return specific error messages
    if (error.message === "Category not found") {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (
      error.message.includes("Cannot delete category") ||
      error.message.includes("subcategor") ||
      error.message.includes("product")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while deleting the category",
      },
      { status: 500 }
    );
  }
}
