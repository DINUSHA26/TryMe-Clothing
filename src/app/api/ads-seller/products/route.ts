import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError, getEffectiveAdsSeller } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";
import { syncAdsSellerItemToStorefront } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/products
 * Fetch all inventory items (synced from ads + standalone products) for the authenticated ads seller
 */
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
    const channel = searchParams.get("channel") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const categoryId = searchParams.get("categoryId") || "";

    const where: Prisma.ClassifiedAdWhereInput = {
      sellerId: adsSeller.id,
      ...(channel === "website" ? { showOnWebsite: true } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const ads = await (prisma as any).classifiedAd.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    let totalProducts = 0;
    let activeProducts = 0;
    let lowStockProducts = 0;
    let liveMarketplaceCount = 0;
    let liveWebsiteCount = 0;
    let livePosCount = 0;

    const allMappedProducts = ads.map((ad: any) => {
      const specs = (typeof ad.specifications === "object" && ad.specifications) || {};
      const baseSku = specs.sku || `AD-${ad.id.slice(-6).toUpperCase()}`;
      const barcode = specs.barcode || baseSku;
      const stock = specs.stock !== undefined ? Number(specs.stock) : 10;
      const isStandalone = !!specs.isStandaloneProduct;
      const compareAtPrice = specs.compareAtPrice ? Number(specs.compareAtPrice) : null;
      // An item is only live on TryMe Shop if explicitly enabled by seller
      const isTryMeShopLive = specs.showInTryMeShop === true;
      const isPosLive = ad.showOnPos !== false && specs.showOnPos !== false;

      totalProducts++;
      if (ad.status === "ACTIVE") activeProducts++;
      if (stock <= 5) lowStockProducts++;
      if (isTryMeShopLive) liveMarketplaceCount++;
      if (ad.showOnWebsite !== false) liveWebsiteCount++;
      if (isPosLive) livePosCount++;

      const variants = Array.isArray(specs.variants)
        ? specs.variants.map((v: any, idx: number) => ({
            id: v.id || `${ad.id}-var-${idx}`,
            name: v.name || "Variant",
            value: v.value || `Option ${idx + 1}`,
            sku: v.sku || `${baseSku}-${idx + 1}`,
            barcode: v.barcode || v.sku || `${baseSku}-${idx + 1}`,
            stock: v.stock !== undefined ? Number(v.stock) : 5,
            price: Number(ad.price || 0) + Number(v.priceAdjustment || 0),
            priceAdjustment: Number(v.priceAdjustment || 0),
            imageUrl: v.image || ad.images?.[0] || null,
          }))
        : [];

      return {
        id: ad.id,
        name: ad.title,
        title: ad.title,
        description: ad.description,
        price: Number(ad.price || 0),
        compareAtPrice,
        sku: baseSku,
        barcode,
        stock,
        isStandalone,
        source: isStandalone ? "DIRECT" : "AD",
        categoryName: ad.category?.name || "General",
        categoryId: ad.categoryId,
        subCategoryName: ad.subCategory?.name || "",
        subCategoryId: ad.subCategoryId,
        images: ad.images || [],
        imageUrl: ad.images?.[0] || null,
        variants,
        showOnWebsite: ad.showOnWebsite !== false,
        showOnMarketplace: isTryMeShopLive,
        showInTryMeShop: isTryMeShopLive,
        showOnPos: isPosLive,
        status: ad.status,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt,
      };
    });

    // If filtered by marketplace (TryMe Shop), only return items with TryMe Shop Live
    const products = channel === "marketplace"
      ? allMappedProducts.filter((p: any) => p.showOnMarketplace)
      : channel === "pos"
      ? allMappedProducts.filter((p: any) => p.showOnPos)
      : allMappedProducts;

    // Also fetch categories for filter and create modal
    const categories = await (prisma as any).adsCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        subCategories: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        stats: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          liveMarketplaceCount,
          liveWebsiteCount,
          livePosCount,
        },
        categories,
      },
    });
  } catch (error: any) {
    console.error("Error fetching ads seller products:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to load products" }, { status: 500 });
  }
}

/**
 * POST /api/ads-seller/products
 * Create a new standalone product or inventory item for Ads Seller
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const effective = await getEffectiveAdsSeller(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }
    const adsSeller = effective.seller;

    const body = await request.json();
    const {
      name,
      description = "",
      price,
      compareAtPrice,
      sku,
      barcode,
      stock = 10,
      images = [],
      categoryId,
      subCategoryId,
      variants = [],
      showOnWebsite = true,
      showOnMarketplace = false,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ success: false, error: "Please enter a valid price" }, { status: 400 });
    }

    // Resolve category and subcategory
    let finalCatId = categoryId;
    let finalSubCatId = subCategoryId;

    if (!finalCatId) {
      const firstCat = await (prisma as any).adsCategory.findFirst({
        where: { isActive: true },
        include: { subCategories: { take: 1 } },
      });
      if (firstCat) {
        finalCatId = firstCat.id;
        finalSubCatId = firstCat.subCategories?.[0]?.id || null;
      }
    } else if (!finalSubCatId) {
      const firstSub = await (prisma as any).adsSubCategory.findFirst({
        where: { categoryId: finalCatId },
      });
      if (firstSub) {
        finalSubCatId = firstSub.id;
      }
    }

    if (!finalCatId || !finalSubCatId) {
      return NextResponse.json(
        { success: false, error: "A category and subcategory are required to create a product." },
        { status: 400 }
      );
    }

    const generatedSku = sku?.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`;
    const generatedBarcode = barcode?.trim() || generatedSku;

    const specifications: any = {
      isStandaloneProduct: true,
      sku: generatedSku,
      barcode: generatedBarcode,
      stock: Math.max(0, parseInt(stock) || 0),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      variants: Array.isArray(variants) ? variants : [],
      showInTryMeShop: false,
      showOnPos: body.showOnPos !== undefined ? !!body.showOnPos : true,
    };

    const newAd = await (prisma as any).classifiedAd.create({
      data: {
        sellerId: adsSeller.id,
        categoryId: finalCatId,
        subCategoryId: finalSubCatId,
        district: "All Island",
        localArea: null,
        title: name.trim(),
        description: description.trim() || name.trim(),
        price: Number(price),
        priceNegotiable: false,
        images: Array.isArray(images) ? images : [],
        specifications,
        status: "ACTIVE", // Direct standalone products are immediately active
        showOnWebsite: !!showOnWebsite,
        showOnMarketplace: true, // Classified visibility
        showOnPos: body.showOnPos !== undefined ? !!body.showOnPos : true,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    // If seller explicitly enabled TryMe Shop by Category on creation, sync to prisma.product
    let isLiveOnTryMeShop = false;
    if (showOnMarketplace) {
      try {
        const syncedSpecs = await syncAdsSellerItemToStorefront({
          ownerUserId: user.userId,
          adId: newAd.id,
          title: newAd.title,
          description: newAd.description,
          price: Number(newAd.price || 0),
          images: newAd.images || [],
          categoryName: newAd.category?.name,
          categorySlug: newAd.category?.slug,
          showOnWebsite: newAd.showOnWebsite,
          specs: specifications,
          showInTryMeShop: true,
        });
        isLiveOnTryMeShop = true;
        await (prisma as any).classifiedAd.update({
          where: { id: newAd.id },
          data: { specifications: syncedSpecs },
        });
      } catch (syncErr: any) {
        console.error("Failed to sync new product to TryMe Shop:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newAd.id,
        name: newAd.title,
        price: Number(newAd.price || 0),
        sku: generatedSku,
        barcode: generatedBarcode,
        stock: specifications.stock,
        categoryName: newAd.category?.name || "General",
        imageUrl: newAd.images?.[0] || null,
        showOnWebsite: newAd.showOnWebsite,
        showOnMarketplace: isLiveOnTryMeShop,
        showInTryMeShop: isLiveOnTryMeShop,
        showOnPos: newAd.showOnPos !== false,
        isStandalone: true,
        source: "DIRECT",
      },
      message: "Product created successfully",
    });
  } catch (error: any) {
    console.error("Error creating ads seller product:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to create product" }, { status: 500 });
  }
}

