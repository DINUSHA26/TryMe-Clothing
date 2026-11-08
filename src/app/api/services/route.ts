import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services
 * Public endpoint to list services published on TryMe Marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const priceType = searchParams.get("priceType");
    const location = searchParams.get("location") || searchParams.get("district");
    const city = searchParams.get("city");
    const deliveryType = searchParams.get("deliveryType");
    const sortBy = searchParams.get("sortBy") || "newest";

    // Shop / Provider Filters (Vendor or Ads Seller)
    const shop = searchParams.get("shop");
    const vendorId = searchParams.get("vendorId");
    const adsSellerId = searchParams.get("adsSellerId");
    const providerType = searchParams.get("providerType");
    const shopSlug = searchParams.get("shopSlug");

    const where: any = {
      isActive: true,
      isDisabledByAdmin: false,
      showOnMarketplace: true,
    };

    const andConditions: any[] = [];

    // Category / Subcategory filter
    if (categoryId && categoryId !== "all") {
      // Find whether categoryId is a Category or Subcategory
      const subMatch = await (prisma as any).serviceSubCategory.findUnique({
        where: { id: categoryId },
      });
      if (subMatch) {
        where.subCategoryId = subMatch.id;
      } else {
        where.categoryId = categoryId;
      }
    }

    if (subCategoryId && subCategoryId !== "all") {
      where.subCategoryId = subCategoryId;
    }

    // Delivery Type Filter
    if (deliveryType && deliveryType !== "all") {
      if (deliveryType === "DOORSTEP") {
        where.deliveryType = { in: ["DOORSTEP", "BOTH"] };
      } else if (deliveryType === "AT_VENDOR") {
        where.deliveryType = { in: ["AT_VENDOR", "BOTH"] };
      } else {
        where.deliveryType = deliveryType;
      }
    }

    // Location / District Filter
    if (location && location !== "all" && location !== "All Sri Lanka" && location !== "Islandwide") {
      andConditions.push({
        OR: [
          { district: { equals: location, mode: "insensitive" } },
          { city: { contains: location, mode: "insensitive" } },
          { serviceArea: { contains: location, mode: "insensitive" } },
        ],
      });
    }

    if (city && city !== "all") {
      where.city = { contains: city, mode: "insensitive" };
    }

    // Shop / Provider Filter (Vendor or Ads Seller)
    if (vendorId) {
      where.vendorId = vendorId;
    } else if (adsSellerId) {
      where.adsSellerId = adsSellerId;
    } else if (shop && shop !== "all") {
      if (shop === "type:vendor") {
        where.vendorId = { not: null };
      } else if (shop === "type:adsseller") {
        where.adsSellerId = { not: null };
      } else if (shop.startsWith("vendor:")) {
        where.vendorId = shop.replace("vendor:", "");
      } else if (shop.startsWith("adsseller:")) {
        where.adsSellerId = shop.replace("adsseller:", "");
      } else {
        andConditions.push({
          OR: [
            { vendorId: shop },
            { adsSellerId: shop },
            { vendor: { slug: shop } },
            { adsSeller: { slug: shop } },
          ],
        });
      }
    } else if (providerType && providerType !== "all") {
      if (providerType === "VENDOR" || providerType === "vendor") {
        where.vendorId = { not: null };
      } else if (providerType === "ADS_SELLER" || providerType === "adsseller") {
        where.adsSellerId = { not: null };
      }
    } else if (shopSlug && shopSlug !== "all") {
      andConditions.push({
        OR: [
          { vendor: { slug: shopSlug } },
          { adsSeller: { slug: shopSlug } },
        ],
      });
    }

    // Text Search
    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { subCategory: { name: { contains: q, mode: "insensitive" } } },
        { vendor: { businessName: { contains: q, mode: "insensitive" } } },
        { adsSeller: { businessName: { contains: q, mode: "insensitive" } } },
        { district: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { serviceArea: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
      andConditions.push({ OR: searchConditions });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (priceType && priceType !== "all") {
      where.priceType = priceType;
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sortBy === "name-asc") {
      orderBy = { name: "asc" };
    } else if (sortBy === "sortOrder") {
      orderBy = { sortOrder: "asc" };
    }

    const [services, total, vendorShops, adsSellerShops] = await Promise.all([
      (prisma as any).websiteService.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true, image: true },
          },
          subCategory: {
            select: { id: true, name: true, slug: true, icon: true, image: true },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              logo: true,
              businessPhone: true,
              isShopOpen: true,
            },
          },
          adsSeller: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).websiteService.count({ where }),
      (prisma as any).vendor.findMany({
        where: {
          services: {
            some: {
              isActive: true,
              isDisabledByAdmin: false,
              showOnMarketplace: true,
            },
          },
        },
        select: {
          id: true,
          businessName: true,
          slug: true,
          logo: true,
        },
        orderBy: { businessName: "asc" },
      }),
      (prisma as any).adsSeller.findMany({
        where: {
          services: {
            some: {
              isActive: true,
              isDisabledByAdmin: false,
              showOnMarketplace: true,
            },
          },
        },
        select: {
          id: true,
          businessName: true,
          slug: true,
        },
        orderBy: { businessName: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        providers: {
          vendors: vendorShops || [],
          adsSellers: adsSellerShops || [],
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching public services:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}

