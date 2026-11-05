import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

/**
 * GET /api/admin/services/subcategories
 * List subcategories, optionally filtered by ?categoryId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const subCategories = await (prisma as any).serviceSubCategory.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: subCategories,
    });
  } catch (error: any) {
    console.error("Error fetching subcategories:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services/subcategories
 * Admin-only: Create a subcategory under a category
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { categoryId, name, description, icon, image, sortOrder } = body;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Parent category ID is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Subcategory name is required" },
        { status: 400 }
      );
    }

    // Verify parent category exists
    const category = await (prisma as any).serviceCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Parent category not found" },
        { status: 404 }
      );
    }

    const baseSlug = generateSlug(name.trim());
    const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
      const existing = await (prisma as any).serviceSubCategory.findFirst({
        where: { categoryId, slug: testSlug },
      });
      return !!existing;
    });

    const subCategory = await (prisma as any).serviceSubCategory.create({
      data: {
        categoryId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        image: image?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: subCategory,
      message: "Subcategory created successfully",
    });
  } catch (error: any) {
    console.error("Error creating subcategory:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create subcategory" },
      { status: 500 }
    );
  }
}

