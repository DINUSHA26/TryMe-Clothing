/**
 * Coupon validation API
 * POST /api/coupons/validate - Validate coupon and calculate discount
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { validateCouponSchema } from "@/lib/validations/checkout";
import { calculateDiscount } from "@/lib/utils/order";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return null;
  }

  // Find or create customer record for this user (lenient like cart API)
  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    try {
      customer = await prisma.customer.create({
        data: { userId },
      });
    } catch (e) {
      console.error("Failed to create customer record:", e);
      return null;
    }
  }

  return customer.id;
}

/**
 * POST /api/coupons/validate
 * Validate coupon code and calculate discount
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    let { code, subtotal, cartItems } = validation.data;
    
    // Round subtotal to 2 decimal places to avoid floating point issues
    subtotal = Number(subtotal.toFixed(2));

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "Invalid coupon code",
        },
      });
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is no longer active",
        },
      });
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is not yet valid",
        },
      });
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon has expired",
        },
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon has reached its usage limit",
        },
      });
    }

    // Check per-user limit
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerId,
      },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "You have already used this coupon",
        },
      });
    }

    // Check vendor-specific coupon
    let eligibleSubtotal = subtotal;
    if (coupon.vendorId) {
      const vendorItems = cartItems.filter(
        (item) => item.vendorId === coupon.vendorId
      );

      if (vendorItems.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            isValid: false,
            error: "This coupon is only valid for specific vendor products",
          },
        });
      }

      const vendorSubtotal = vendorItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      eligibleSubtotal = Number(vendorSubtotal.toFixed(2));
    }

    // Check minimum order amount
    if (
      coupon.minOrderAmount &&
      eligibleSubtotal < coupon.minOrderAmount.toNumber()
    ) {
      const errorMsg = coupon.vendorId
        ? `Minimum order amount for this vendor's products is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`
        : `Minimum order amount is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`;
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: errorMsg,
        },
      });
    }

    // Calculate discount
    const discountAmount = calculateDiscount(
      eligibleSubtotal,
      coupon.type,
      coupon.value,
      coupon.maxDiscount
    );

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value.toNumber(),
          minOrderAmount: coupon.minOrderAmount?.toNumber() || null,
          maxDiscount: coupon.maxDiscount?.toNumber() || null,
          vendorId: coupon.vendorId,
        },
        discount: {
          amount: discountAmount,
          type: coupon.type,
          originalSubtotal: subtotal,
          finalSubtotal: subtotal - discountAmount,
        },
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
