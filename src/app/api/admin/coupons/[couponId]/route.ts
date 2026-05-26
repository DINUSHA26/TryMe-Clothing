/**
 * Admin Coupon Detail API
 * GET /api/admin/coupons/[couponId] - Get coupon details
 * PATCH /api/admin/coupons/[couponId] - Update coupon
 * DELETE /api/admin/coupons/[couponId] - Delete coupon
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateCouponSchema } from "@/lib/validations/coupon";

/**
 * GET /api/admin/coupons/[couponId]
 * Get coupon details with usage statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Auth check
    const user = requireAdmin(request);

    const { couponId } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    // Get usage statistics
    const totalDiscount = await prisma.order.aggregate({
      where: {
        couponId: coupon.id,
      },
      _sum: {
        discountAmount: true,
      },
    });

    // Get recent usages
    const recentUsages = await prisma.couponUsage.findMany({
      where: {
        couponId: coupon.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        usedAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        coupon,
        stats: {
          totalOrders: coupon._count.orders,
          totalUsages: coupon._count.usages,
          totalDiscount: totalDiscount._sum.discountAmount?.toNumber() || 0,
          remainingUsage: coupon.usageLimit
            ? coupon.usageLimit - coupon.usageCount
            : null,
        },
        recentUsages,
      },
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/coupons/[couponId]
 * Update coupon details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Auth check
    requireAdmin(request);

    const { couponId } = await params;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate date range if both dates are provided
    if (data.validFrom && data.validUntil) {
      if (data.validUntil <= data.validFrom) {
        return NextResponse.json(
          {
            success: false,
            error: "Valid until date must be after valid from date",
          },
          { status: 400 }
        );
      }
    }

    // Check if code is being updated and if it already exists
    if (data.code && data.code !== existingCoupon.code) {
      const duplicateCoupon = await prisma.coupon.findUnique({
        where: { code: data.code },
      });

      if (duplicateCoupon) {
        return NextResponse.json(
          { success: false, error: "Coupon code already exists" },
          { status: 400 }
        );
      }
    }

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.type && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.minOrderAmount !== undefined && {
          minOrderAmount: data.minOrderAmount,
        }),
        ...(data.maxDiscount !== undefined && {
          maxDiscount: data.maxDiscount,
        }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
        ...(data.perUserLimit !== undefined && {
          perUserLimit: data.perUserLimit,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.validFrom && { validFrom: data.validFrom }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil }),
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
      data: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons/[couponId]
 * Delete coupon (only if not used in any orders)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Auth check
    requireAdmin(request);

    const { couponId } = await params;

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    // Check if coupon has been used in orders
    if (coupon._count.orders > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete coupon that has been used in orders. Consider deactivating it instead.",
        },
        { status: 400 }
      );
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: couponId },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
