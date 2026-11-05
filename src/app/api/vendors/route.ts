import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendors
 * Public endpoint - Get approved vendors and ads sellers with category filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    // Fetch active business categories with icons for circular filter strip
    const categories = await prisma.adsCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    // Build filter for Vendors
    const vendorWhere: any = {
      status: "ACTIVE",
      user: {
        isActive: true,
      },
    };

    const effectiveCategory = category && category !== "all" ? category : null;
    const effectiveCategoryId = categoryId && categoryId !== "all" ? categoryId : null;

    if (effectiveCategoryId || effectiveCategory) {
      // Find category in database to get its ID and all children IDs
      const matchedCat = await prisma.category.findFirst({
        where: {
          OR: [
            ...(effectiveCategoryId ? [{ id: effectiveCategoryId }] : []),
            ...(effectiveCategory ? [{ slug: effectiveCategory }, { name: { equals: effectiveCategory, mode: "insensitive" as const } }] : []),
          ],
        },
        include: { children: { select: { id: true, name: true, slug: true } } },
      });

      const matchedCategoryIds: string[] = matchedCat
        ? [matchedCat.id, ...(matchedCat.children?.map((c) => c.id) || [])]
        : effectiveCategoryId
        ? [effectiveCategoryId]
        : [];

      const categoryNameForPrimary = matchedCat?.name || effectiveCategory || "";

      vendorWhere.OR = [
        ...(categoryNameForPrimary ? [{ primaryCategory: { equals: categoryNameForPrimary, mode: "insensitive" as const } }] : []),
        ...(matchedCategoryIds.length > 0
          ? [
              {
                products: {
                  some: {
                    categoryId: { in: matchedCategoryIds },
                    isActive: true,
                    isDisabledByAdmin: false,
                  },
                },
              },
            ]
          : [
              {
                products: {
                  some: {
                    category: {
                      OR: [
                        { name: { equals: effectiveCategory!, mode: "insensitive" as const } },
                        { slug: effectiveCategory! },
                      ],
                    },
                    isActive: true,
                    isDisabledByAdmin: false,
                  },
                },
              },
            ]),
      ];
    }

    if (search) {
      vendorWhere.businessName = {
        contains: search,
        mode: "insensitive",
      };
    }

    const vendors = await prisma.vendor.findMany({
      where: vendorWhere,
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessAddress: true,
        description: true,
        logo: true,
        banner: true,
        primaryCategory: true,
        commissionRate: true,
        userId: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDisabledByAdmin: false,
              },
            },
          },
        },
      },
      orderBy: {
        businessName: "asc",
      },
    });

    // Also fetch approved Ads Sellers
    const adsSellerWhere: any = {
      status: "ACTIVE",
      user: {
        isActive: true,
      },
    };

    if (category && category !== "all") {
      adsSellerWhere.primaryCategory = { equals: category, mode: "insensitive" };
    }

    if (search) {
      adsSellerWhere.businessName = {
        contains: search,
        mode: "insensitive",
      };
    }

    const adsSellers = await prisma.adsSeller.findMany({
      where: adsSellerWhere,
      select: {
        id: true,
        businessName: true,
        slug: true,
        phone: true,
        aboutContent: true,
        primaryCategory: true,
        userId: true,
        user: {
          select: {
            avatar: true,
          },
        },
        _count: {
          select: {
            ads: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map vendors to standard display model
    const existingUserIds = new Set(vendors.map((v) => v.userId));

    const formattedVendors = vendors.map((v) => ({
      id: v.id,
      businessName: v.businessName,
      slug: v.slug,
      businessAddress: v.businessAddress,
      description: v.description,
      logo: v.logo,
      banner: v.banner,
      primaryCategory: v.primaryCategory || "General Store",
      productCount: v._count.products,
      sellerType: "VENDOR" as const,
      storeUrl: `/vendors/${v.slug}`,
    }));

    // Add Ads Sellers who don't already have a standalone active vendor shop listed
    const formattedAdsSellers = adsSellers
      .filter((s) => !existingUserIds.has(s.userId))
      .map((s) => ({
        id: s.id,
        businessName: s.businessName || "Ads Store",
        slug: s.slug,
        businessAddress: null,
        description: s.aboutContent,
        logo: s.user?.avatar || null,
        banner: null,
        primaryCategory: s.primaryCategory || "Classifieds",
        productCount: s._count.ads,
        sellerType: "ADS_SELLER" as const,
        storeUrl: `/marketplace/sellers/${s.slug}`,
      }));

    const allSellers = [...formattedVendors, ...formattedAdsSellers];

    return NextResponse.json({
      success: true,
      data: allSellers,
      categories,
    });
  } catch (error) {
    console.error("[GET /api/vendors] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch vendors",
      },
      { status: 500 }
    );
  }
}
