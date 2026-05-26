/**
 * Vendor Coupon Management API
 * GET /api/vendor/coupons - List vendor's own coupons
 * POST /api/vendor/coupons - Create vendor-specific coupon
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createCouponSchema,
  couponFiltersSchema,
} from "@/lib/validations/coupon";

/**
 * GET /api/vendor/coupons
 * List vendor's own coupons with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const vendor = requireVendor(request);

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: vendor.userId },
    });

    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const vendorId = vendorRecord.id;

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

    const { search, type, isActive, page, limit } = validation.data;

    // Build where clause - vendor can only see their own coupons
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

    // Get total count
    const total = await prisma.coupon.count({ where });

    // Get coupons with pagination
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

    // Calculate stats
    const stats = {
      total,
      active: await prisma.coupon.count({
        where: { ...where, isActive: true },
      }),
      inactive: await prisma.coupon.count({
        where: { ...where, isActive: false },
      }),
    };

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
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/coupons
 * Create a new vendor-specific coupon
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const vendor = requireVendor(request);

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: vendor.userId },
    });

    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const vendorId = vendorRecord.id;

    const body = await request.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate date range
    if (data.validUntil && data.validUntil <= data.validFrom) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid until date must be after valid from date",
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    // Create coupon - automatically set vendorId to current vendor
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        vendorId, // Always set to current vendor
        isActive: data.isActive,
        isFeatured: data.isFeatured ?? false,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
