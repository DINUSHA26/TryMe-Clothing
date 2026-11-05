import { prisma } from "@/lib/prisma";
import { evaluateAndEnforceSubscriptionLifecycle } from "@/lib/website-subscription-guard";

export async function getStandaloneSiteData(domainOrSlug: string) {
  try {
    const cleanParam = decodeURIComponent(domainOrSlug).toLowerCase().replace(/^www\./, "");

    // 1. Try finding by Custom Domain first
    const domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
      where: {
        OR: [{ domain: cleanParam }, { domain: `www.${cleanParam}` }],
      },
      include: {
        vendor: {
          include: {
            websiteConfig: {
              include: {
                pages: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            products: {
              where: { isActive: true, isDraft: false, isDisabledByAdmin: false, showOnWebsite: true },
              take: 48,
              include: {
                images: { orderBy: { position: "asc" } },
                variants: true,
                category: { select: { id: true, name: true, slug: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            services: {
              where: { isActive: true, isDisabledByAdmin: false },
              include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                subCategory: { select: { id: true, name: true, slug: true } },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        adsSeller: {
          include: {
            websiteConfig: {
              include: {
                pages: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            ads: {
              where: { status: { in: ["ACTIVE", "PENDING"] }, showOnWebsite: true },
              take: 48,
              orderBy: { createdAt: "desc" },
            },
            services: {
              where: { isActive: true, isDisabledByAdmin: false },
              include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                subCategory: { select: { id: true, name: true, slug: true } },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    let vendor = domainRecord?.vendor;
    let adsSeller = domainRecord?.adsSeller;

    // 2. If not found by custom domain, look up by vendor slug or ads-seller slug
    if (!vendor && !adsSeller) {
      vendor = await prisma.vendor.findUnique({
        where: { slug: cleanParam },
        include: {
          websiteConfig: {
            include: {
              pages: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          products: {
            where: { isActive: true, isDraft: false, isDisabledByAdmin: false, showOnWebsite: true },
            take: 48,
            include: {
              images: { orderBy: { position: "asc" } },
              variants: true,
              category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          services: {
            where: { isActive: true, isDisabledByAdmin: false },
            include: {
              category: { select: { id: true, name: true, slug: true, icon: true } },
              subCategory: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!vendor) {
        adsSeller = await (prisma as any).adsSeller.findUnique({
          where: { slug: cleanParam },
          include: {
            websiteConfig: {
              include: {
                pages: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            ads: {
              where: { status: { in: ["ACTIVE", "PENDING"] }, showOnWebsite: true },
              take: 48,
              orderBy: { createdAt: "desc" },
            },
            services: {
              where: { isActive: true, isDisabledByAdmin: false },
              include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                subCategory: { select: { id: true, name: true, slug: true } },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        });
      }
    }

    if (!vendor && !adsSeller) {
      return null;
    }

    const entity = vendor || adsSeller;
    let linkedVendorId = vendor ? vendor.id : null;
    let linkedAdsSellerId = adsSeller ? adsSeller.id : null;

    if (entity?.userId) {
      if (!linkedVendorId) {
        const v = await prisma.vendor.findUnique({
          where: { userId: entity.userId },
          select: { id: true },
        });
        if (v) linkedVendorId = v.id;
      }
      if (!linkedAdsSellerId) {
        const s = await (prisma as any).adsSeller.findUnique({
          where: { userId: entity.userId },
          select: { id: true },
        });
        if (s) linkedAdsSellerId = s.id;
      }
    }

    const whereClause: {
      vendorId?: string;
      adsSellerId?: string;
      OR?: Array<{ vendorId?: string; adsSellerId?: string }>;
    } = {
      ...(vendor ? { vendorId: vendor.id } : { adsSellerId: adsSeller.id }),
      ...(linkedVendorId && linkedAdsSellerId
        ? {
            OR: [
              { vendorId: linkedVendorId },
              { adsSellerId: linkedAdsSellerId },
            ],
          }
        : {}),
    };

    // 3. Evaluate & enforce 1-month subscription + 14-day grace period
    const lifecycle = await evaluateAndEnforceSubscriptionLifecycle(whereClause);

    // If 14 days have passed after subscription expiry without renewal/upgrade:
    // - Custom domain was automatically disconnected by evaluateAndEnforceSubscriptionLifecycle
    // - Live website access is blocked!
    if (lifecycle.state === "EXPIRED_DISCONNECTED") {
      return {
        siteOffline: true,
        offlineReason: "SUBSCRIPTION_EXPIRED_14_DAYS",
        expiresAt: lifecycle.expiresAt,
        graceEndsAt: lifecycle.graceEndsAt,
        vendor: {
          id: entity.id,
          businessName: entity.businessName,
          slug: entity.slug,
          logo: (entity as any).logo || (entity as any).contactInfo?.logo,
        },
      } as any;
    }

    const config = entity?.websiteConfig;
    const activeSub = lifecycle.subscription;

    const rawItems = (vendor ? vendor.products : adsSeller?.ads) || [];
    const websiteReviewsRaw: any[] = Array.isArray((config?.reviewsSection as any)?.websiteReviews)
      ? (config?.reviewsSection as any).websiteReviews.filter((r: any) => r.isVisible !== false)
      : [];

    const products = rawItems.map((item: any) => {
      const isVendorProduct = !!vendor;
      const title = isVendorProduct ? item.name : item.title;
      const images: string[] = isVendorProduct
        ? (item.images || []).map((img: any) => img.url).filter(Boolean)
        : (item.images || []).filter(Boolean);
      const primaryImage = images[0] || null;
      const priceNum = item.price ? Number(item.price) : null;
      const itemReviews = websiteReviewsRaw.filter(
        (r: any) => r.itemId === item.id || r.productSlug === item.slug
      );
      const avgRating =
        itemReviews.length > 0
          ? Math.round(
              (itemReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) /
                itemReviews.length) *
                10
            ) / 10
          : 5.0;

      return {
        id: item.id,
        title,
        name: title,
        slug: isVendorProduct ? item.slug : item.id,
        price: priceNum,
        compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
        description: item.description || "",
        image: primaryImage,
        images,
        stock: isVendorProduct ? Number(item.stock ?? 10) : 1,
        sku: item.sku || null,
        category: item.category || null,
        variants: isVendorProduct
          ? (item.variants || []).map((v: any) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              priceAdjustment: v.priceAdjustment ? Number(v.priceAdjustment) : 0,
              stock: Number(v.stock ?? 0),
              image: v.image || null,
            }))
          : [],
        specifications: item.specifications || null,
        district: item.district || null,
        localArea: item.localArea || null,
        priceNegotiable: Boolean(item.priceNegotiable),
        reviews: itemReviews,
        averageRating: avgRating,
        reviewCount: itemReviews.length,
        type: isVendorProduct ? ("PRODUCT" as const) : ("AD" as const),
        url: isVendorProduct ? `/products/${item.slug}` : `/ads/${item.id}`,
      };
    });

    // Determine effective tier: SIX_PAGES / TWELVE_PAGES vs ONE_PAGE
    const configuredMode = (config?.footerSection as any)?.ecommerceConfig?.websiteMode;
    const activeTier: "ONE_PAGE" | "SIX_PAGES" | "TWELVE_PAGES" =
      configuredMode === "ONE_PAGE"
        ? "ONE_PAGE"
        : configuredMode === "MULTI_PAGE"
        ? activeSub?.tier === "TWELVE_PAGES"
          ? "TWELVE_PAGES"
          : "SIX_PAGES"
        : activeSub?.tier ||
          (config?.pages && config.pages.length > 0 ? "SIX_PAGES" : "ONE_PAGE");

    return {
      siteOffline: false,
      type: vendor ? "VENDOR" : "ADS_SELLER",
      tier: activeTier,
      vendor: {
        id: entity.id,
        userId: (entity as any).userId,
        linkedVendorId: linkedVendorId || (vendor ? vendor.id : null),
        businessName: entity.businessName,
        slug: entity.slug,
        logo: (entity as any).logo || (entity as any).contactInfo?.logo,
        banner: (entity as any).banner || (entity as any).contactInfo?.banner,
        phone: (entity as any).businessPhone || (entity as any).phone,
        email: (entity as any).businessEmail,
        address: (entity as any).businessAddress,
      },
      config,
      subscription: activeSub,
      subscriptionLifecycle: lifecycle,
      products,
      services: (entity as any).services || [],
      websiteReviews: websiteReviewsRaw,
    };
  } catch (error) {
    console.error("Error in getStandaloneSiteData:", error);
    return null;
  }
}
