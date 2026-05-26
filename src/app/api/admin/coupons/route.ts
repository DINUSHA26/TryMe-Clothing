/**
 * Admin Coupon Management API
 * GET /api/admin/coupons - List all coupons (platform-wide and vendor-specific)
 * POST /api/admin/coupons - Create platform-wide coupon
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createCouponSchema,
  couponFiltersSchema,
} from "@/lib/validations/coupon";

/**
 * GET /api/admin/coupons
 * List all coupons with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const validation = couponFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { search, type, isActive, vendorId, page, limit } = validation.data;

    // Build where clause
    const where: Prisma.CouponWhereInput = {};

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

    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Get total count
    const total = await prisma.coupon.count({ where });

    // Get coupons with pagination
    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
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
      platformWide: await prisma.coupon.count({
        where: { ...where, vendorId: null },
      }),
      vendorSpecific: await prisma.coupon.count({
        where: { ...where, vendorId: { not: null } },
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
 * POST /api/admin/coupons
 * Create a new platform-wide coupon
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

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

    // If vendorId is provided, verify it exists
    if (data.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: data.vendorId },
      });

      if (!vendor) {
        return NextResponse.json(
          { success: false, error: "Vendor not found" },
          { status: 404 }
        );
      }
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        vendorId: data.vendorId,
        isActive: data.isActive,
        isFeatured: data.isFeatured ?? false,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
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
