import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { reorderImagesSchema } from "@/lib/validations/product";

/**
 * PATCH /api/vendor/products/[id]/images/reorder
 * Reorder product images
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
    const validation = reorderImagesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { images } = validation.data;

    // Update positions in transaction
    await prisma.$transaction(
      images.map((img) =>
        prisma.productImage.update({
          where: { id: img.id },
          data: { position: img.position },
        })
      )
    );

    // Fetch updated product with images
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { product: updatedProduct },
    });
  } catch (error) {
    console.error("Error reordering product images:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while reordering images",
      },
      { status: 500 }
    );
  }
}
