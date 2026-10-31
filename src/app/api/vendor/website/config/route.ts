import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

async function getVendorOrSeller(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true, logo: true, banner: true, businessPhone: true, businessEmail: true, businessAddress: true },
  });
  if (vendor) return { type: "VENDOR" as const, entity: vendor };

  const adsSeller = await (prisma as any).adsSeller.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true, phone: true, contactInfo: true },
  });
  if (adsSeller) return { type: "ADS_SELLER" as const, entity: adsSeller };

  return null;
}

export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await getVendorOrSeller(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Vendor or seller account not found" }, { status: 404 });
    }

    const whereClause = target.type === "VENDOR" ? { vendorId: target.entity.id } : { adsSellerId: target.entity.id };

    // Fetch config, pages, custom domain, and active subscription
    let config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: whereClause,
      include: {
        pages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // If no config exists, initialize default config
    if (!config) {
      const defaultHero = {
        enabled: true,
        title: target.entity.businessName || "Welcome to our store",
        subtitle: "Discover high quality curated products with premium customer care.",
        buttonText: "Book via WhatsApp",
        buttonLink: "#contact",
        bgImage: (target.entity as any).banner || "",
        badgeText: "PREMIUM SELECTION",
      };

      const defaultAbout = {
        enabled: true,
        title: `About ${target.entity.businessName || "Us"}`,
        content: "We provide professional services and high quality products in a clean, welcoming environment.",
        images: [],
      };

      const defaultServices = {
        enabled: true,
        title: "Featured Services & Products",
        subtitle: "Explore our popular offerings",
        items: [],
      };

      const defaultContact = {
        enabled: true,
        title: "Get in Touch",
        subtitle: "We'd love to hear from you",
        phone: (target.entity as any).businessPhone || (target.entity as any).phone || "",
        whatsapp: (target.entity as any).businessPhone || (target.entity as any).phone || "",
        email: (target.entity as any).businessEmail || "",
        address: (target.entity as any).businessAddress || "",
      };

      config = await (prisma as any).vendorWebsiteConfig.create({
        data: {
          ...whereClause,
          themeTemplate: "modern-clean",
          primaryColor: "#E91E63",
          secondaryColor: "#111827",
          fontFamily: "Inter",
          headerStyle: "sticky",
          heroSection: defaultHero,
          aboutSection: defaultAbout,
          servicesSection: defaultServices,
          gallerySection: { enabled: true, title: "A Glimpse of Our Work", images: [] },
          reviewsSection: { enabled: true, title: "What Our Customers Say", items: [] },
          contactSection: defaultContact,
          footerSection: { enabled: true, copyrightText: `© ${new Date().getFullYear()} ${target.entity.businessName}. All rights reserved.` },
          isPublished: false,
        },
        include: {
          pages: true,
        },
      });
    }

    // Fetch active subscription
    const activeSub = await (prisma as any).vendorWebsiteSubscription.findFirst({
      where: {
        ...whereClause,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch custom domain
    const customDomain = await (prisma as any).vendorCustomDomain.findFirst({
      where: whereClause,
    });

    // Fetch and sync products (for Vendor) or ads (for AdsSeller)
    let rawItems: any[] = [];
    if (target.type === "VENDOR") {
      rawItems = await prisma.product.findMany({
        where: {
          vendorId: target.entity.id,
          isActive: true,
          isDraft: false,
          isDisabledByAdmin: false,
        },
        include: { images: true },
        orderBy: { createdAt: "desc" },
        take: 36,
      });
    } else {
      rawItems = await (prisma as any).classifiedAd.findMany({
        where: {
          sellerId: target.entity.id,
          status: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        take: 36,
      });
    }

    const products = rawItems.map((item: any) => {
      const isVendorProduct = target.type === "VENDOR";
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

    return NextResponse.json({
      success: true,
      data: {
        config,
        activeSubscription: activeSub,
        customDomain,
        entityType: target.type,
        entityInfo: {
          id: target.entity.id,
          businessName: target.entity.businessName,
          slug: target.entity.slug,
          logo: (target.entity as any).logo || (target.entity as any).contactInfo?.logo || null,
          banner: (target.entity as any).banner || (target.entity as any).contactInfo?.banner || null,
          phone: (target.entity as any).businessPhone || (target.entity as any).phone || "",
        },
        products,
      },
    });
  } catch (error: any) {
    console.error("Error fetching website config:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch website config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await getVendorOrSeller(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Vendor or seller account not found" }, { status: 404 });
    }

    const whereClause = target.type === "VENDOR" ? { vendorId: target.entity.id } : { adsSellerId: target.entity.id };
    const body = await request.json();

    const updatedConfig = await (prisma as any).vendorWebsiteConfig.upsert({
      where: whereClause,
      create: {
        ...whereClause,
        themeTemplate: body.themeTemplate || "modern-clean",
        primaryColor: body.primaryColor || "#E91E63",
        secondaryColor: body.secondaryColor || "#111827",
        fontFamily: body.fontFamily || "Inter",
        headerStyle: body.headerStyle || "sticky",
        navItemsJson: body.navItemsJson || null,
        heroSection: body.heroSection || null,
        aboutSection: body.aboutSection || null,
        servicesSection: body.servicesSection || null,
        gallerySection: body.gallerySection || null,
        reviewsSection: body.reviewsSection || null,
        contactSection: body.contactSection || null,
        footerSection: body.footerSection || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        ogImage: body.ogImage || null,
        googleAnalyticsId: body.googleAnalyticsId || null,
        facebookPixelId: body.facebookPixelId || null,
        isPublished: Boolean(body.isPublished),
        publishedAt: body.isPublished ? new Date() : null,
      },
      update: {
        themeTemplate: body.themeTemplate,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        fontFamily: body.fontFamily,
        headerStyle: body.headerStyle,
        navItemsJson: body.navItemsJson,
        heroSection: body.heroSection,
        aboutSection: body.aboutSection,
        servicesSection: body.servicesSection,
        gallerySection: body.gallerySection,
        reviewsSection: body.reviewsSection,
        contactSection: body.contactSection,
        footerSection: body.footerSection,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        ogImage: body.ogImage,
        googleAnalyticsId: body.googleAnalyticsId,
        facebookPixelId: body.facebookPixelId,
        isPublished: Boolean(body.isPublished),
        publishedAt: body.isPublished ? new Date() : undefined,
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error: any) {
    console.error("Error updating website config:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save website config" }, { status: 500 });
  }
}
