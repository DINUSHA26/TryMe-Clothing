import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateCouponSchema } from "@/lib/validations/coupon";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";
import { Prisma } from "@prisma/client";

/**
 * GET /api/ads-seller/coupons/[couponId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ couponId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { couponId } = await context.params;
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const vendorId = sellerVendor.vendor.id;

    const coupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
        vendorId,
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

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch coupon" }, { status: 500 });
  }
}

/**
 * PATCH /api/ads-seller/coupons/[couponId]
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ couponId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { couponId } = await context.params;
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const vendorId = sellerVendor.vendor.id;

    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
        vendorId,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ success: false, error: "Coupon not found or unauthorized" }, { status: 404 });
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
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Prisma.Decimal(data.value);
    if (data.minOrderAmount !== undefined)
      updateData.minOrderAmount = data.minOrderAmount ? new Prisma.Decimal(data.minOrderAmount) : null;
    if (data.maxDiscount !== undefined)
      updateData.maxDiscount = data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : null;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit || null;
    if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
    if (data.applicableTo !== undefined) updateData.applicableTo = data.applicableTo;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
    if (data.validUntil !== undefined)
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
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
      message: "Coupon updated successfully",
      data: updated,
    });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}

/**
 * DELETE /api/ads-seller/coupons/[couponId]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ couponId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { couponId } = await context.params;
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const vendorId = sellerVendor.vendor.id;

    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        id: couponId,
        vendorId,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ success: false, error: "Coupon not found or unauthorized" }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to delete coupon" }, { status: 500 });
  }
}

