import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError, getEffectiveAdsSeller } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { id } = await context.params;

    const effective = await getEffectiveAdsSeller(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }
    const adsSeller = effective.seller;

    const ad = await (prisma as any).classifiedAd.findUnique({
      where: { id },
      select: { id: true, sellerId: true, specifications: true },
    });

    if (!ad || ad.sellerId !== adsSeller.id) {
      return NextResponse.json({ success: false, error: "Product not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    const specs = (typeof ad.specifications === "object" && ad.specifications) ? { ...ad.specifications } : {};

    if (body.showOnMarketplace !== undefined) {
      updateData.showOnMarketplace = !!body.showOnMarketplace;
    }
    if (body.showOnWebsite !== undefined) {
      updateData.showOnWebsite = !!body.showOnWebsite;
    }
    if (body.price !== undefined) {
      updateData.price = Number(body.price);
    }
    if (body.name !== undefined) {
      updateData.title = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }
    if (body.stock !== undefined) {
      specs.stock = Math.max(0, parseInt(body.stock) || 0);
    }
    if (body.sku !== undefined) {
      specs.sku = body.sku.trim();
    }
    if (body.barcode !== undefined) {
      specs.barcode = body.barcode.trim();
    }
    if (body.variants !== undefined) {
      specs.variants = body.variants;
    }
    if (body.compareAtPrice !== undefined) {
      specs.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
    }

    updateData.specifications = specs;

    const updated = await (prisma as any).classifiedAd.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.title,
        price: Number(updated.price || 0),
        showOnMarketplace: updated.showOnMarketplace,
        showOnWebsite: updated.showOnWebsite,
        specifications: updated.specifications,
      },
      message: "Product updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating ads seller product:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { id } = await context.params;

    const effective = await getEffectiveAdsSeller(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }
    const adsSeller = effective.seller;

    const ad = await (prisma as any).classifiedAd.findUnique({
      where: { id },
      select: { id: true, sellerId: true, specifications: true },
    });

    if (!ad || ad.sellerId !== adsSeller.id) {
      return NextResponse.json({ success: false, error: "Product not found or unauthorized" }, { status: 404 });
    }

    // Delete item
    await (prisma as any).classifiedAd.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting ads seller product:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
