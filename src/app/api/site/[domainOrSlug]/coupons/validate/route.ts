import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandaloneSiteData } from "@/lib/site-resolver";
import { calculateDiscount } from "@/lib/utils/order";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteData(domainOrSlug);

    if (!siteData || !siteData.vendor) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const rawCode = body?.code;
    let subtotal = Number(body?.subtotal || 0);

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();
    subtotal = Math.max(0, Number(subtotal.toFixed(2)));

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

    // Check channel applicability: Must be BOTH or OWN_WEBSITE
    if (coupon.applicableTo === "TRYME") {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is only valid on the TryMe.lk marketplace",
        },
      });
    }

    // Check vendor ownership
    if (coupon.vendorId && coupon.vendorId !== siteData.vendor.id) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is not valid for this store",
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

    // Check total usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon has reached its maximum usage limit",
        },
      });
    }

    // Check min order amount
    if (
      coupon.minOrderAmount &&
      subtotal < coupon.minOrderAmount.toNumber()
    ) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`,
        },
      });
    }

    // Calculate discount
    const discountAmount = calculateDiscount(
      subtotal,
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
          applicableTo: coupon.applicableTo,
        },
        discount: {
          amount: discountAmount,
          type: coupon.type,
          originalSubtotal: subtotal,
          finalSubtotal: Number((subtotal - discountAmount).toFixed(2)),
        },
      },
    });
  } catch (error: any) {
    console.error("Error validating standalone site coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

