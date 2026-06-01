import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

/**
 * GET /api/ads/seller/ads
 * List all ads posted by the authenticated seller
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where: Prisma.ClassifiedAdWhereInput = {
      sellerId: seller.id,
      ...(status && status !== "all" && {
        status: status as any,
      }),
    };

    const totalCount = await prisma.classifiedAd.count({ where });

    const ads = await prisma.classifiedAd.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { name: true, icon: true },
        },
        subCategory: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ads,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing seller ads:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while listing ads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads/seller/ads
 * Create a new classified ad (with plan limits validation)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            plan: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // 1. Plan limit guard
    const activeSub = seller.subscriptions[0];
    if (!activeSub) {
      return NextResponse.json(
        { success: false, error: "No active subscription plan found. Please purchase a plan first." },
        { status: 403 }
      );
    }

    const maxAds = activeSub.plan.maxAds;
    const currentActiveCount = await prisma.classifiedAd.count({
      where: {
        sellerId: seller.id,
        status: { in: ["ACTIVE", "PENDING"] },
      },
    });

    if (currentActiveCount >= maxAds) {
      return NextResponse.json(
        {
          success: false,
          error: `Plan limit reached. You have used all ${maxAds} listing slots in your current "${activeSub.plan.name}".`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      subCategoryId,
      district,
      localArea,
      title,
      description,
      price,
      priceNegotiable,
      images,
      specifications,
    } = body;

    // Basic fields validation
    if (!categoryId || !subCategoryId || !district || !title || !description) {
      return NextResponse.json(
        { success: false, error: "Please fill in all mandatory fields (Category, Location, Title, Description)." },
        { status: 400 }
      );
    }

    // 2. Validate specifications against required fieldDefinitions in database
    const fieldDefinitions = await prisma.adFieldDefinition.findMany({
      where: { subCategoryId },
    });

    const parsedSpecs = specifications || {};
    for (const field of fieldDefinitions) {
      if (field.isRequired) {
        const value = parsedSpecs[field.fieldKey];
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return NextResponse.json(
            { success: false, error: `Specification field "${field.label}" is required.` },
            { status: 400 }
          );
        }
      }
    }

    // Parse price
    let parsedPrice = null;
    if (price !== undefined && price !== null && price !== "") {
      parsedPrice = parseFloat(price.toString());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid price." },
          { status: 400 }
        );
      }
    }

    // Create classified ad
    const ad = await prisma.classifiedAd.create({
      data: {
        sellerId: seller.id,
        categoryId,
        subCategoryId,
        district,
        localArea: localArea || null,
        title,
        description,
        price: parsedPrice,
        priceNegotiable: !!priceNegotiable,
        images: Array.isArray(images) ? images : [],
        specifications: parsedSpecs,
        status: "PENDING",
      },
    });

    // Increment adsUsed in subscription
    await prisma.adsSubscription.update({
      where: { id: activeSub.id },
      data: {
        adsUsed: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: ad,
      message: "Ad submitted successfully for moderation.",
    });
  } catch (error) {
    console.error("Error creating classified ad:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while creating the ad" },
      { status: 500 }
    );
  }
}
