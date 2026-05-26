import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { addImageSchema } from "@/lib/validations/product";

/**
 * POST /api/vendor/products/[id]/images
 * Add images to product
 */
export async function POST(
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
      include: {
        images: true,
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
    const validation = addImageSchema.safeParse(body);

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

    // Check total image count (max 10)
    if (product.images.length + images.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot add ${images.length} images. Maximum 10 images per product (currently ${product.images.length}).`,
        },
        { status: 400 }
      );
    }

    // Add images
    await prisma.productImage.createMany({
      data: images.map((img) => ({
        productId,
        url: img.url,
        altText: img.altText,
        position: img.position,
      })),
    });

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
    console.error("Error adding product images:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while adding images",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/products/[id]/images?imageId=xxx
 * Delete product image
 */
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          error: "Image ID is required",
        },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to vendor
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
      include: {
        images: true,
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

    // Check if this is the last image
    if (product.images.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete the last image. Products must have at least one image.",
        },
        { status: 400 }
      );
    }

    // Verify image belongs to this product
    const image = product.images.find((img) => img.id === imageId);
    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: "Image not found",
        },
        { status: 404 }
      );
    }

    // Delete image
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Image deleted successfully",
      },
    });
  } catch (error) {
    console.error("Error deleting product image:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while deleting the image",
      },
      { status: 500 }
    );
  }
}
