import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";
import { DEFAULT_SERVICE_CATEGORIES } from "@/lib/constants/service-categories";

/**
 * GET /api/vendor/services/categories
 * Returns all active service categories and their subcategories for Vendors and AdsSellers.
 * Auto-seeds defaults if table is empty.
 */
export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let categories = await (prisma as any).serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (categories.length === 0) {
      for (const cat of DEFAULT_SERVICE_CATEGORIES) {
        const createdCat = await (prisma as any).serviceCategory.upsert({
          where: { slug: cat.slug },
          update: {},
          create: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
          },
        });

        for (const sub of cat.subCategories) {
          await (prisma as any).serviceSubCategory.upsert({
            where: {
              categoryId_slug: {
                categoryId: createdCat.id,
                slug: sub.slug,
              },
            },
            update: {},
            create: {
              categoryId: createdCat.id,
              name: sub.name,
              slug: sub.slug,
              sortOrder: sub.sortOrder,
            },
          });
        }
      }

      categories = await (prisma as any).serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching service categories for vendor:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
