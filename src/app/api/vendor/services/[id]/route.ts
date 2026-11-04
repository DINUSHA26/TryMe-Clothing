import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { resolveWebsiteEntity } from "@/lib/website-entity-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const { id } = await params;
    const service = await (prisma as any).websiteService.findUnique({
      where: { id },
      include: {
        category: true,
        subCategory: true,
      },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    const isOwner =
      (target.vendorId && service.vendorId === target.vendorId) ||
      (target.adsSellerId && service.adsSellerId === target.adsSellerId);

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your service" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error fetching service:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch service" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const { id } = await params;
    const existing = await (prisma as any).websiteService.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    const isOwner =
      (target.vendorId && existing.vendorId === target.vendorId) ||
      (target.adsSellerId && existing.adsSellerId === target.adsSellerId);

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your service" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined && body.name.trim() !== existing.name) {
      updateData.name = body.name.trim();
      const baseSlug = generateSlug(body.name.trim());
      updateData.slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
        const match = await (prisma as any).websiteService.findFirst({
          where: {
            slug: testSlug,
            ...target.flexibleWhere,
          },
        });
        return match && match.id !== id;
      });
    }

    if (body.categoryId !== undefined) {
      const category = await (prisma as any).serviceCategory.findUnique({
        where: { id: body.categoryId, isActive: true },
      });
      if (!category) {
        return NextResponse.json(
          { success: false, error: "Selected category not found or inactive" },
          { status: 400 }
        );
      }
      updateData.categoryId = body.categoryId;
    }

    if (body.subCategoryId !== undefined) {
      if (body.subCategoryId === null || body.subCategoryId === "") {
        updateData.subCategoryId = null;
      } else {
        const catId = body.categoryId || existing.categoryId;
        const subCategory = await (prisma as any).serviceSubCategory.findUnique({
          where: { id: body.subCategoryId, categoryId: catId, isActive: true },
        });
        if (!subCategory) {
          return NextResponse.json(
            { success: false, error: "Selected subcategory does not belong to this category" },
            { status: 400 }
          );
        }
        updateData.subCategoryId = body.subCategoryId;
      }
    }

    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }

    if (body.shortDesc !== undefined) {
      updateData.shortDesc = body.shortDesc ? String(body.shortDesc).trim() : null;
    }

    if (body.price !== undefined) {
      if (body.price === null || body.price === "") {
        updateData.price = null;
      } else {
        const num = Number(body.price);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { success: false, error: "Price must be a valid non-negative number" },
            { status: 400 }
          );
        }
        updateData.price = num;
      }
    }

    if (body.priceType !== undefined) {
      updateData.priceType = body.priceType;
    }

    if (body.duration !== undefined) {
      updateData.duration = body.duration ? String(body.duration).trim() : null;
    }

    if (body.features !== undefined && Array.isArray(body.features)) {
      updateData.features = body.features.map((f: any) => String(f).trim()).filter(Boolean);
    }

    if (body.images !== undefined && Array.isArray(body.images)) {
      updateData.images = body.images.map((img: any) => String(img).trim()).filter(Boolean);
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }

    const updated = await (prisma as any).websiteService.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subCategory: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Service updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating service:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error?.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const { id } = await params;
    const existing = await (prisma as any).websiteService.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    const isOwner =
      (target.vendorId && existing.vendorId === target.vendorId) ||
      (target.adsSellerId && existing.adsSellerId === target.adsSellerId);

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your service" }, { status: 403 });
    }

    await (prisma as any).websiteService.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete service" }, { status: 500 });
  }
}
