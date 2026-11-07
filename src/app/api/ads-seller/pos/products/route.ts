import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError, getEffectiveAdsSeller } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const effective = await getEffectiveAdsSeller(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Ads seller profile not found" }, { status: 404 });
    }
    const adsSeller = effective.seller;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const ads = await (prisma as any).classifiedAd.findMany({
      where: {
        sellerId: adsSeller.id,
        status: "ACTIVE",
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        specifications: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const products = ads.map((ad: any) => {
      const specs = (typeof ad.specifications === "object" && ad.specifications) || {};
      const baseSku = specs.sku || `AD-${ad.id.slice(-6).toUpperCase()}`;
      const stock = specs.stock !== undefined ? Number(specs.stock) : 10;

      return {
        id: ad.id,
        name: ad.title,
        price: Number(ad.price || 0),
        compareAtPrice: null,
        sku: baseSku,
        barcode: baseSku,
        unit: specs.unit || "PCS",
        stock,
        categoryName: ad.category?.name || "Advertised Item",
        imageUrl: ad.images?.[0] || null,
        variants: Array.isArray(specs.variants)
          ? specs.variants.map((v: any, idx: number) => ({
              id: `${ad.id}-var-${idx}`,
              name: v.name || "Option",
              value: v.value || `Variant ${idx + 1}`,
              sku: v.sku || `${baseSku}-${idx + 1}`,
              barcode: v.sku || `${baseSku}-${idx + 1}`,
              stock: v.stock !== undefined ? Number(v.stock) : 5,
              price: Number(ad.price || 0) + Number(v.priceAdjustment || 0),
              priceAdjustment: Number(v.priceAdjustment || 0),
              imageUrl: v.image || ad.images?.[0] || null,
            }))
          : [],
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        vendor: {
          businessName: adsSeller.businessName || "Ads Store",
          businessPhone: adsSeller.phone || "",
          businessEmail: adsSeller.user?.email || "",
          businessAddress: "In-Store / Classifieds",
          logo: null,
        },
      },
    });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch ads products" }, { status: 500 });
  }
}
