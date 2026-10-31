import { prisma } from "@/lib/prisma";

export async function getStandaloneSiteData(domainOrSlug: string) {
  try {
    const cleanParam = decodeURIComponent(domainOrSlug).toLowerCase().replace(/^www\./, "");

    // 1. Try finding by Custom Domain first
    let domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
      where: {
        OR: [
          { domain: cleanParam },
          { domain: `www.${cleanParam}` },
        ],
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
            websiteSubscriptions: {
              where: {
                status: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            products: {
              where: { isActive: true, isDraft: false, isDisabledByAdmin: false },
              take: 24,
              include: { images: true },
              orderBy: { createdAt: "desc" },
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
            websiteSubscriptions: {
              where: {
                status: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            ads: {
              where: { status: "ACTIVE" },
              take: 24,
              orderBy: { createdAt: "desc" },
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
          websiteSubscriptions: {
            where: {
              status: "ACTIVE",
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          products: {
            where: { isActive: true, isDraft: false, isDisabledByAdmin: false },
            take: 24,
            include: { images: true },
            orderBy: { createdAt: "desc" },
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
            websiteSubscriptions: {
              where: {
                status: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            ads: {
              where: { status: "ACTIVE" },
              take: 24,
              orderBy: { createdAt: "desc" },
            },
          },
        });
      }
    }

    if (!vendor && !adsSeller) {
      return null;
    }

    const entity = vendor || adsSeller;
    const config = entity?.websiteConfig;
    const activeSub = entity?.websiteSubscriptions?.[0] || null;

    const rawItems = (vendor ? vendor.products : adsSeller?.ads) || [];
    const products = rawItems.map((item: any) => {
      const isVendorProduct = !!vendor;
      const title = isVendorProduct ? item.name : item.title;
      const images: string[] = isVendorProduct
        ? (item.images || []).map((img: any) => img.url).filter(Boolean)
        : (item.images || []).filter(Boolean);
      const primaryImage = images[0] || null;
      const priceNum = item.price ? Number(item.price) : null;

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
        type: isVendorProduct ? ("PRODUCT" as const) : ("AD" as const),
        url: isVendorProduct ? `/products/${item.slug}` : `/ads/${item.id}`,
      };
    });

    return {
      type: vendor ? "VENDOR" : "ADS_SELLER",
      vendor: {
        id: entity.id,
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
      products,
    };
  } catch (error) {
    console.error("Error in getStandaloneSiteData:", error);
    return null;
  }
}
