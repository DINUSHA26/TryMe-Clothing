import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

async function getVendorOrSeller(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true },
  });
  if (vendor) {
    return { type: "VENDOR" as const, entity: vendor };
  }
  const adsSeller = await (prisma as any).adsSeller.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true },
  });
  if (adsSeller) {
    return { type: "ADS_SELLER" as const, entity: adsSeller };
  }
  return null;
}

/**
 * GET /api/vendor/services
 * Returns all services belonging to current Vendor or AdsSeller
 */
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
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const whereClause =
      target.type === "VENDOR" ? { vendorId: target.entity.id } : { adsSellerId: target.entity.id };

    const services = await (prisma as any).websiteService.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        subCategory: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error("Error fetching vendor services:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/services
 * Creates a new service for current Vendor or AdsSeller
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      subCategoryId,
      name,
      description,
      shortDesc,
      price,
      priceType,
      duration,
      images,
      features,
      isFeatured,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Service category is required" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Service description is required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await (prisma as any).serviceCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Selected service category does not exist" },
        { status: 400 }
      );
    }

    // Verify subcategory if provided
    if (subCategoryId) {
      const subCategory = await (prisma as any).serviceSubCategory.findFirst({
        where: { id: subCategoryId, categoryId },
      });
      if (!subCategory) {
        return NextResponse.json(
          { success: false, error: "Selected subcategory does not belong to the chosen category" },
          { status: 400 }
        );
      }
    }

    // Generate slug
    const baseSlug = generateSlug(name.trim());
    const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
      const condition =
        target.type === "VENDOR"
          ? { vendorId: target.entity.id, slug: testSlug }
          : { adsSellerId: target.entity.id, slug: testSlug };
      const match = await (prisma as any).websiteService.findFirst({
        where: condition,
      });
      return !!match;
    });

    let parsedPrice = null;
    if (price !== undefined && price !== null && price !== "" && priceType !== "CONTACT_FOR_PRICE") {
      parsedPrice = parseFloat(price.toString());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid service price" },
          { status: 400 }
        );
      }
    }

    const cleanFeatures = Array.isArray(features)
      ? features.map((f: any) => String(f).trim()).filter(Boolean)
      : [];

    const cleanImages = Array.isArray(images)
      ? images.map((img: any) => String(img).trim()).filter(Boolean)
      : [];

    const service = await (prisma as any).websiteService.create({
      data: {
        vendorId: target.type === "VENDOR" ? target.entity.id : null,
        adsSellerId: target.type === "ADS_SELLER" ? target.entity.id : null,
        categoryId,
        subCategoryId: subCategoryId || null,
        name: name.trim(),
        slug,
        description: description.trim(),
        shortDesc: shortDesc ? String(shortDesc).trim() : null,
        price: parsedPrice,
        priceType: priceType || "FIXED",
        duration: duration ? String(duration).trim() : null,
        images: cleanImages,
        features: cleanFeatures,
        isActive: true,
        isFeatured: !!isFeatured,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: "Service created successfully for your website",
    });
  } catch (error: any) {
    console.error("Error creating vendor service:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create service" },
      { status: 500 }
    );
  }
}
