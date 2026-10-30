import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";
import { getAuthUser } from "@/lib/auth-helpers";

async function getVendorConfig(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true },
  });
  const whereClause = vendor ? { vendorId: vendor.id } : null;

  if (!whereClause) {
    const adsSeller = await (prisma as any).adsSeller.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!adsSeller) return null;
    return {
      type: "ADS_SELLER",
      id: adsSeller.id,
      whereClause: { adsSellerId: adsSeller.id },
    };
  }

  return {
    type: "VENDOR",
    id: vendor.id,
    whereClause,
  };
}

export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await getVendorConfig(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    const config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: target.whereClause,
      include: {
        pages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!config) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: config.pages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await getVendorConfig(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    // Check active subscription
    const activeSub = await (prisma as any).vendorWebsiteSubscription.findFirst({
      where: {
        ...target.whereClause,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeSub) {
      return NextResponse.json(
        { success: false, error: "An active website subscription is required to add custom pages. Please subscribe to unlock." },
        { status: 403 }
      );
    }

    const currentTier: WebsiteTier = activeSub.tier;
    const tierLimit = TIER_LIMITS[currentTier]?.maxPages || 1;

    // Get config & count existing pages
    const config = await (prisma as any).vendorWebsiteConfig.findFirst({
      where: target.whereClause,
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });

    if (!config) {
      return NextResponse.json({ success: false, error: "Website configuration not found" }, { status: 404 });
    }

    if (config._count.pages >= tierLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Page limit reached for your current plan (${TIER_LIMITS[currentTier].name} allows max ${tierLimit} pages). Please upgrade your subscription to add more pages.`,
          requiredTier: currentTier === "ONE_PAGE" ? "SIX_PAGES" : "TWELVE_PAGES",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, slug, contentHtml, sectionsJson, metaTitle, metaDescription } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: "Page title and slug are required" }, { status: 400 });
    }

    // Format slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newPage = await (prisma as any).vendorWebsitePage.create({
      data: {
        websiteConfigId: config.id,
        title,
        slug: cleanSlug,
        contentHtml: contentHtml || "",
        sectionsJson: sectionsJson || null,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || "",
        sortOrder: config._count.pages,
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, data: newPage });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "A page with this URL slug already exists." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
