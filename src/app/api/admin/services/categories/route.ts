import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthUser, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { DEFAULT_SERVICE_CATEGORIES } from "@/lib/constants/service-categories";

/**
 * GET /api/admin/services/categories
 * Returns all service categories with their subcategories. Auto-seeds defaults if empty.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let categories = await (prisma as any).serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subCategories: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { services: true } },
          },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    // Auto-seed defaults if database table is completely empty
    if (categories.length === 0) {
      for (const cat of DEFAULT_SERVICE_CATEGORIES) {
        const createdCat = await (prisma as any).serviceCategory.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
          },
        });

        for (const sub of cat.subCategories) {
          await (prisma as any).serviceSubCategory.create({
            data: {
              categoryId: createdCat.id,
              name: sub.name,
              slug: sub.slug,
              sortOrder: sub.sortOrder,
            },
          });
        }
      }

      categories = await (prisma as any).serviceCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          subCategories: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { services: true } },
            },
          },
          _count: {
            select: { services: true },
          },
        },
      });
    } else {
      // Check if existing categories are missing subcategories and seed them
      const totalSubs = await (prisma as any).serviceSubCategory.count();
      if (totalSubs === 0) {
        for (const cat of DEFAULT_SERVICE_CATEGORIES) {
          const match = categories.find((c: any) => c.slug === cat.slug);
          if (match) {
            for (const sub of cat.subCategories) {
              await (prisma as any).serviceSubCategory.upsert({
                where: {
                  categoryId_slug: {
                    categoryId: match.id,
                    slug: sub.slug,
                  },
                },
                update: {},
                create: {
                  categoryId: match.id,
                  name: sub.name,
                  slug: sub.slug,
                  sortOrder: sub.sortOrder,
                },
              });
            }
          }
        }

        categories = await (prisma as any).serviceCategory.findMany({
          orderBy: { sortOrder: "asc" },
          include: {
            subCategories: {
              orderBy: { sortOrder: "asc" },
              include: {
                _count: { select: { services: true } },
              },
            },
            _count: {
              select: { services: true },
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching service categories:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services/categories
 * Admin-only: Creates a new service category
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { name, description, icon, image, sortOrder } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const baseSlug = generateSlug(name.trim());
    const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
      const existing = await (prisma as any).serviceCategory.findUnique({
        where: { slug: testSlug },
      });
      return !!existing;
    });

    const category = await (prisma as any).serviceCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || "Wrench",
        image: image?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error: any) {
    console.error("Error creating service category:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
