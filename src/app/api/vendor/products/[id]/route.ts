import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { updateProductSchema } from "@/lib/validations/product";

/**
 * GET /api/vendor/products/[id]
 * Get product details (vendor can only access own products)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = requireVendor(request);

    const { id } = await params;

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

    // Get product with ownership check
    const product = await prisma.product.findFirst({
      where: {
        id,
        vendorId, // Critical: only own products
      },
      include: {
        category: true,
        images: {
          orderBy: { position: "asc" },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
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

    return NextResponse.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching the product",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/products/[id]
 * Update product (vendor can only update own products)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = requireVendor(request);

    const { id } = await params;

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

    // Check if product exists and belongs to vendor
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        vendorId, // Critical: only own products
      },
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

    // Check if product is disabled by admin
    if (existingProduct.isDisabledByAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This product has been disabled by the administrator. You cannot make changes until it is re-enabled.",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

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

    // If category is being changed, verify it exists
    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: "Category not found",
          },
          { status: 404 }
        );
      }
    }

    // If name is being changed, generate new slug
    let slug = existingProduct.slug;
    if (data.name && data.name !== existingProduct.name) {
      const baseSlug = generateSlug(data.name);
      slug = await generateUniqueSlug(baseSlug, async (slug) => {
        if (slug === existingProduct.slug) return false; // Same slug is okay
        const existing = await prisma.product.findUnique({ where: { slug } });
        return !!existing;
      });
    }

    // Update product and variants in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Update core product fields
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
          ...(data.name && { name: data.name, slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.price !== undefined && {
            price: new Prisma.Decimal(data.price)
          }),
          ...(data.compareAtPrice !== undefined && {
            compareAtPrice: data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null,
          }),
          ...(data.sku !== undefined && { sku: data.sku || null }),
          ...(data.stock !== undefined && { stock: data.stock }),
          ...(data.lowStockThreshold !== undefined && {
            lowStockThreshold: data.lowStockThreshold,
          }),
          ...(data.sizeChart !== undefined && { sizeChart: data.sizeChart }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isDraft !== undefined && { isDraft: data.isDraft }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: { position: "asc" },
          },
          variants: true,
        },
      });

      // 2. Replace images if provided
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });

        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img) => ({
              productId: id,
              url: img.url,
              altText: img.altText || null,
              position: img.position || 0,
            })),
          });
        }
      }

      // Replace variants if provided
      if (data.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });

        if (data.variants.length > 0) {
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId: id,
              name: v.name,
              value: v.value,
              priceAdjustment: (v.priceAdjustment !== undefined && v.priceAdjustment !== null)
                ? new Prisma.Decimal(v.priceAdjustment)
                : new Prisma.Decimal(0),
              stock: v.stock,
              sku: v.sku || null,
              image: v.image || null,
            })),
          });
        }

        // Re-fetch with updated variants
        return tx.product.findUnique({
          where: { id },
          include: {
            category: { select: { id: true, name: true } },
            images: { orderBy: { position: "asc" } },
            variants: { orderBy: { createdAt: "asc" } },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error("Error updating product:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? `Server Error: ${error.message}` : "An error occurred while updating the product",
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/products/[id]
 * Soft delete product (set isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = requireVendor(request);

    const { id } = await params;

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

    // Check if product exists and belongs to vendor
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        vendorId, // Critical: only own products
      },
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

    // Soft delete: just set isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Product deactivated successfully",
      },
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while deleting the product",
      },
      { status: 500 }
    );
  }
}
