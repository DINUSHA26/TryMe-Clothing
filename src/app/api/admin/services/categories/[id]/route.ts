import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { name, description, icon, image, isActive, sortOrder } = body;

    const existing = await (prisma as any).serviceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Service category not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name && name.trim() !== existing.name) {
      updateData.name = name.trim();
      const baseSlug = generateSlug(name.trim());
      updateData.slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
        const match = await (prisma as any).serviceCategory.findUnique({
          where: { slug: testSlug },
        });
        return match && match.id !== id;
      });
    }

    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || "Wrench";
    if (image !== undefined) updateData.image = image?.trim() || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder) || 0;

    const updated = await (prisma as any).serviceCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating service category:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to update service category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const servicesCount = await (prisma as any).websiteService.count({
      where: { categoryId: id },
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category because it has ${servicesCount} active services linked to it. You can set it to inactive instead.`,
        },
        { status: 400 }
      );
    }

    await (prisma as any).serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service category:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to delete service category" },
      { status: 500 }
    );
  }
}

