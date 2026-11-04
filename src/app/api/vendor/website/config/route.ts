import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";
import { evaluateAndEnforceSubscriptionLifecycle } from "@/lib/website-subscription-guard";
import { resolveWebsiteEntity } from "@/lib/website-entity-helper";

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

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Vendor or seller account not found" }, { status: 404 });
    }

    // 1. Evaluate and enforce 1-month subscription + 14-day grace period rules first (using flexible matching so both seller & vendor links match)
    const lifecycle = await evaluateAndEnforceSubscriptionLifecycle(target.flexibleWhere);

    // 2. Fetch config and pages
    let config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: target.flexibleWhere,
      include: {
        pages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

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
        content:
          "We provide professional services and high quality products in a clean, welcoming environment.",
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
          ...target.primaryWhere,
          themeTemplate: "modern-clean",
          primaryColor: "#5c2336",
          secondaryColor: "#111827",
          fontFamily: "Inter",
          headerStyle: "sticky",
          heroSection: defaultHero,
          aboutSection: defaultAbout,
          servicesSection: defaultServices,
          gallerySection: { enabled: false, title: "A Glimpse of Our Work", images: [] },
          reviewsSection: { enabled: false, title: "What Our Customers Say", items: [] },
          contactSection: defaultContact,
          footerSection: {
            enabled: true,
            copyrightText: `© ${new Date().getFullYear()} ${target.entity.businessName}. All rights reserved.`,
          },
          isPublished: false,
        },
        include: {
          pages: true,
        },
      });
    }

    // 3. Fetch custom domain (will be null if auto-disconnected after 14 days post-expiry)
    const customDomain = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.flexibleWhere,
    });

    // 4. Fetch and sync products (for Vendor) or ads (for AdsSeller)
    let rawItems: any[] = [];
    if (target.type === "VENDOR") {
      rawItems = await prisma.product.findMany({
        where: {
          vendorId: target.entity.id,
          isActive: true,
          isDraft: false,
          isDisabledByAdmin: false,
          showOnWebsite: true,
        },
        include: { images: true },
        orderBy: { createdAt: "desc" },
        take: 36,
      });
    } else {
      rawItems = await (prisma as any).classifiedAd.findMany({
        where: {
          sellerId: target.entity.id,
          status: { in: ["ACTIVE", "PENDING"] },
          showOnWebsite: true,
        },
        orderBy: { createdAt: "desc" },
        take: 36,
      });
    }

    const products = rawItems.map((item: any) => {
      const isVendorProduct = target.type === "VENDOR";
      const title = isVendorProduct ? item.name : item.title;
      const price = isVendorProduct ? Number(item.price) : Number(item.price || 0);
      const salePrice = isVendorProduct && item.salePrice ? Number(item.salePrice) : null;
      const images = isVendorProduct
        ? item.images?.map((img: any) => img.url) || []
        : Array.isArray(item.images)
        ? item.images
        : [];
      const image = images[0] || "/placeholder-product.png";

      return {
        id: item.id,
        title,
        price,
        salePrice,
        image,
        images,
        description: item.description || "",
        inStock: isVendorProduct ? (item.stockQuantity ?? 1) > 0 : true,
        slug: item.slug || item.id,
        type: isVendorProduct ? "PRODUCT" : "AD",
      };
    });

    // 5. Fetch Services added by this vendor or ads seller
    const services = await (prisma as any).websiteService.findMany({
      where: {
        ...target.flexibleWhere,
        isActive: true,
      },
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        config,
        activeSubscription: lifecycle.state === "ACTIVE" ? lifecycle.subscription : null,
        subscriptionLifecycle: lifecycle,
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
        services,
      },
    });
  } catch (error: any) {
    console.error("Error fetching website config:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch website config" },
      { status: 500 }
    );
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

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json({ success: false, error: "Vendor or seller account not found" }, { status: 404 });
    }

    const body = await request.json();

    // Enforce subscription expiry rules before allowing updates or publishing
    const lifecycle = await evaluateAndEnforceSubscriptionLifecycle(target.flexibleWhere);

    if (
      lifecycle.state === "EXPIRED_GRACE_PERIOD" ||
      lifecycle.state === "EXPIRED_DISCONNECTED"
    ) {
      const expStr = lifecycle.expiresAt
        ? new Date(lifecycle.expiresAt).toLocaleDateString("en-LK", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "recently";
      return NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_EXPIRED",
          error: `Your website plan expired on ${expStr}. You cannot update or publish your website until you renew or upgrade your plan.`,
          subscriptionLifecycle: lifecycle,
        },
        { status: 403 }
      );
    }

    if (body.isPublished && lifecycle.state !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_REQUIRED",
          error: "An active 1-month website subscription is required to publish your website.",
          subscriptionLifecycle: lifecycle,
        },
        { status: 403 }
      );
    }

    // Check if configuration already exists under either ID
    const existingConfig = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: target.flexibleWhere,
    });

    let updatedConfig;
    if (existingConfig) {
      updatedConfig = await (prisma as any).vendorWebsiteConfig.update({
        where: { id: existingConfig.id },
        data: {
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
          customSections: body.customSections !== undefined ? body.customSections : undefined,
          sectionsOrder: body.sectionsOrder !== undefined ? body.sectionsOrder : undefined,
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
    } else {
      updatedConfig = await (prisma as any).vendorWebsiteConfig.create({
        data: {
          ...target.primaryWhere,
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
          customSections: body.customSections !== undefined ? body.customSections : null,
          sectionsOrder: body.sectionsOrder !== undefined ? body.sectionsOrder : null,
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          ogImage: body.ogImage || null,
          googleAnalyticsId: body.googleAnalyticsId || null,
          facebookPixelId: body.facebookPixelId || null,
          isPublished: Boolean(body.isPublished),
          publishedAt: body.isPublished ? new Date() : null,
        },
        include: {
          pages: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      subscriptionLifecycle: lifecycle,
    });
  } catch (error: any) {
    console.error("Error updating website config:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save website config" },
      { status: 500 }
    );
  }
}
