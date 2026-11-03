import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.userId },
      select: { id: true, businessName: true, logo: true, businessPhone: true, businessAddress: true },
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        isActive: true,
        isDisabledByAdmin: false,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                {
                  variants: {
                    some: {
                      OR: [
                        { sku: { contains: search, mode: "insensitive" } },
                        { value: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
        },
        variants: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 150,
    });

    const formatted = products.map((p) => {
      const baseSku = p.sku?.trim() || `PRD-${p.id.slice(-6).toUpperCase()}`;
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        sku: baseSku,
        barcode: baseSku,
        stock: p.stock,
        categoryName: p.category?.name || "General",
        imageUrl: p.images[0]?.url || null,
        variants: p.variants.map((v) => {
          const varSku = v.sku?.trim() || `${baseSku}-${v.value.toUpperCase()}`;
          return {
            id: v.id,
            name: v.name,
            value: v.value,
            sku: varSku,
            barcode: varSku,
            stock: v.stock,
            price: Number(p.price) + Number(v.priceAdjustment || 0),
            priceAdjustment: Number(v.priceAdjustment || 0),
            imageUrl: v.image || p.images[0]?.url || null,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products: formatted,
        vendor,
      },
    });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}
