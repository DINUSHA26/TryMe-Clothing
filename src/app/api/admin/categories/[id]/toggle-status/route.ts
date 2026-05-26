import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toggleCategoryStatusSchema } from "@/lib/validations/category";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * PATCH /api/admin/categories/[id]/toggle-status
 * Enable or disable a category
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
    const validation = toggleCategoryStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { isActive } = validation.data;

    // Update category status
    const category = await prisma.category.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      data: {
        category,
        message: `Category ${isActive ? "enabled" : "disabled"} successfully`,
      },
    });
  } catch (error) {
    console.error("Error toggling category status:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the category status",
      },
      { status: 500 }
    );
  }
}
