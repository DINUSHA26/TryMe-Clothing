import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

/**
 * PATCH /api/admin/services/subcategories/[id]
 * Admin-only: Update subcategory
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);

    const { id } = await params;
    const existing = await (prisma as any).serviceSubCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined && body.name.trim() !== existing.name) {
      updateData.name = body.name.trim();
      const baseSlug = generateSlug(body.name.trim());
      updateData.slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
        const match = await (prisma as any).serviceSubCategory.findFirst({
          where: { categoryId: existing.categoryId, slug: testSlug },
        });
        return match && match.id !== id;
      });
    }

    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder) || 0;
    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;

    const updated = await (prisma as any).serviceSubCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Subcategory updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating subcategory:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/subcategories/[id]
 * Admin-only: Delete subcategory
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);

    const { id } = await params;
    const existing = await (prisma as any).serviceSubCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { services: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    if (existing._count?.services > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete subcategory because ${existing._count.services} service(s) are currently assigned to it.`,
        },
        { status: 400 }
      );
    }

    await (prisma as any).serviceSubCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting subcategory:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}

