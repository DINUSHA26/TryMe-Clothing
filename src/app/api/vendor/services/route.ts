import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import { resolveWebsiteEntity } from "@/lib/website-entity-helper";

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

    const target = await resolveWebsiteEntity(userId);

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const services = await (prisma as any).websiteService.findMany({
      where: target.flexibleWhere,
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
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/services
 * Creates a new service for the current Vendor or AdsSeller
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

    const target = await resolveWebsiteEntity(userId);

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      categoryId,
      subCategoryId,
      description,
      shortDesc,
      price,
      priceType,
      duration,
      images,
      features,
      isFeatured,
    } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid service category is required" },
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
      where: { id: categoryId, isActive: true },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Selected category not found or inactive" },
        { status: 400 }
      );
    }

    // Verify subcategory if provided
    if (subCategoryId) {
      const subCategory = await (prisma as any).serviceSubCategory.findUnique({
        where: { id: subCategoryId, categoryId, isActive: true },
      });
      if (!subCategory) {
        return NextResponse.json(
          { success: false, error: "Selected subcategory does not belong to this category" },
          { status: 400 }
        );
      }
    }

    // Generate unique slug
    const baseSlug = generateSlug(name.trim());
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await (prisma as any).websiteService.findFirst({
        where: {
          slug: s,
          ...target.flexibleWhere,
        },
      });
      return !existing;
    });

    let parsedPrice: number | null = null;
    if (price !== undefined && price !== null && price !== "") {
      const num = Number(price);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "Price must be a valid non-negative number" },
          { status: 400 }
        );
      }
      parsedPrice = num;
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
      message: "Service created successfully",
    });
  } catch (error: any) {
    console.error("Error creating vendor service:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create service" },
      { status: 500 }
    );
  }
}
