import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  addVariantSchema,
  updateVariantSchema,
} from "@/lib/validations/product";

/**
 * POST /api/vendor/products/[id]/variants
 * Add variant to product
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
        variants: true,
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
    const validation = addVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for duplicate name+value combination
    const duplicate = product.variants.find(
      (v) => v.name === data.name && v.value === data.value
    );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `A variant with ${data.name}: ${data.value} already exists`,
        },
        { status: 400 }
      );
    }

    // Check max variants (50)
    if (product.variants.length >= 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum 50 variants per product",
        },
        { status: 400 }
      );
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: data.name,
        value: data.value,
        priceAdjustment: data.priceAdjustment,
        stock: data.stock,
        sku: data.sku,
      },
    });

    return NextResponse.json({
      success: true,
      data: { variant },
    });
  } catch (error) {
    console.error("Error adding product variant:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while adding the variant",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/products/[id]/variants?variantId=xxx
 * Update variant
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
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get("variantId");

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant ID is required",
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

    // Verify variant belongs to this product
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

    // Parse and validate request body
    const body = await request.json();
    const validation = updateVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.priceAdjustment !== undefined && {
          priceAdjustment: data.priceAdjustment,
        }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.sku !== undefined && { sku: data.sku }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { variant: updatedVariant },
    });
  } catch (error) {
    console.error("Error updating product variant:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the variant",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/products/[id]/variants?variantId=xxx
 * Delete variant
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
    const variantId = searchParams.get("variantId");

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant ID is required",
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

    // Verify variant belongs to this product
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

    // Delete variant
    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Variant deleted successfully",
      },
    });
  } catch (error) {
    console.error("Error deleting product variant:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while deleting the variant",
      },
      { status: 500 }
    );
  }
}
