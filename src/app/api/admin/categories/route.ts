import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import {
  createCategorySchema,
  categoryListQuerySchema,
} from "@/lib/validations/category";
import { Prisma } from "@prisma/client";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

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
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

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

    // If parentId is provided, validate depth limit (max 2 levels)
    if (data.parentId) {
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

    // Generate unique slug
    const baseSlug = data.slug || generateSlug(data.name);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existing = await prisma.category.findUnique({ where: { slug } });
      return !!existing;
    });

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error("Error creating category:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while creating the category",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/categories
 * List all categories with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParentId = searchParams.get("parentId");
    const parentId = rawParentId === "null" ? null : rawParentId;

    const queryValidation = categoryListQuerySchema.safeParse({
      ...Object.fromEntries(searchParams),
      ...(rawParentId !== null && { parentId }),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: queryValidation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const query = queryValidation.data;

    // Build where clause
    const where: Prisma.CategoryWhereInput = {
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.parentId !== undefined && {
        parentId: query.parentId,
      }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive === "true",
      }),
    };

    // Build orderBy clause
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    // Get total count
    const totalCount = await prisma.category.count({ where });

    // Get categories with pagination
    const categories = await prisma.category.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
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
        children: undefined, // remove children to match CategoryListItem type
        _count: {
          products: (cat._count?.products || 0) + subcategoryProductsCount,
          children: cat._count?.children || 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / query.pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing categories:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching categories",
      },
      { status: 500 }
    );
  }
}
