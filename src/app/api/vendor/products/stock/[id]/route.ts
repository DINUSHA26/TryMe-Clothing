import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateStockSchema } from "@/lib/validations/product";

/**
 * PATCH /api/vendor/products/stock/[id]
 * Quick stock update for product or variant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Look up vendor record (TokenPayload has no vendorId field)
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    const { id: productId } = await params;

    // Verify product exists and belongs to vendor
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // Check if product is disabled by admin
    if (product.isDisabledByAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This product has been disabled by the administrator. You cannot make changes.",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { stock, variantId } = validation.data;

    // Update stock
    if (variantId) {
      // Update variant stock
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
        },
      });

      if (!variant) {
        return NextResponse.json(
          {
            success: false,
            error: "Variant not found",
          },
          { status: 404 }
        );
      }

      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock },
      });

      return NextResponse.json({
        success: true,
        data: {
          message: "Variant stock updated successfully",
          stock,
        },
      });
    } else {
      // Update product stock
      await prisma.product.update({
        where: { id: productId },
        data: { stock },
      });

      return NextResponse.json({
        success: true,
        data: {
          message: "Product stock updated successfully",
          stock,
        },
      });
    }
  } catch (error) {
    console.error("Error updating stock:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating stock",
      },
      { status: 500 }
    );
  }
}
