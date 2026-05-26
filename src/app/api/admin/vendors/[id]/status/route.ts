import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

/**
 * PATCH /api/admin/vendors/[id]/status
 * Toggle vendor active status (enable/disable)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = toggleStatusSchema.safeParse(body);

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

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Update user's isActive status
    await prisma.user.update({
      where: { id: vendor.userId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Vendor ${isActive ? "enabled" : "disabled"} successfully`,
        isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling vendor status:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating vendor status",
      },
      { status: 500 }
    );
  }
}
