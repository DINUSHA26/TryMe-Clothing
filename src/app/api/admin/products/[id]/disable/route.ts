import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disableProductSchema } from "@/lib/validations/product";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * PATCH /api/admin/products/[id]/disable
 * Admin disable/enable product with reason
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = disableProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { isDisabledByAdmin, adminDisableReason } = validation.data;

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        isDisabledByAdmin,
        adminDisableReason: isDisabledByAdmin ? adminDisableReason : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        product,
        message: `Product ${isDisabledByAdmin ? "disabled" : "enabled"} successfully`,
      },
    });
  } catch (error) {
    console.error("Error disabling product:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the product",
      },
      { status: 500 }
    );
  }
}
