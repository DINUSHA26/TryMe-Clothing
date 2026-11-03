import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createCouponSchema,
  couponFiltersSchema,
} from "@/lib/validations/coupon";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/coupons
 * List Ads Seller's coupons with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller profile not found" }, { status: 404 });
    }

    const vendorId = sellerVendor.vendor.id;

    const { searchParams } = new URL(request.url);
    const validation = couponFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { search, type, isActive, applicableTo, page, limit } = validation.data;

    const where: Prisma.CouponWhereInput = {
      vendorId,
    };

    if (search) {
      where.code = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (applicableTo) {
      where.applicableTo = applicableTo;
    }

    const total = await prisma.coupon.count({ where });

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const activeCount = await prisma.coupon.count({
      where: { vendorId, isActive: true },
    });

    const inactiveCount = await prisma.coupon.count({
      where: { vendorId, isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        coupons,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total,
          active: activeCount,
          inactive: inactiveCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Error listing ads seller coupons:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads-seller/coupons
 * Create a new coupon for Ads Seller
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller profile not found" }, { status: 404 });
    }

    const vendorId = sellerVendor.vendor.id;

    const body = await request.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      applicableTo,
      validFrom,
      validUntil,
    } = validation.data;

    // Check code uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        value: new Prisma.Decimal(value),
        minOrderAmount: minOrderAmount ? new Prisma.Decimal(minOrderAmount) : null,
        maxDiscount: maxDiscount ? new Prisma.Decimal(maxDiscount) : null,
        usageLimit: usageLimit || null,
        perUserLimit: perUserLimit || 1,
        applicableTo: applicableTo || "BOTH",
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        vendorId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error: any) {
    console.error("Error creating ads seller coupon:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

