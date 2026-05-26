/**
 * Public Deals API
 * GET /api/deals - List featured, active, and valid coupons (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "FLAT" | "PERCENTAGE" | null;
    const scope = searchParams.get("scope") as "platform" | "vendor" | null;
    const expiring = searchParams.get("expiring");

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Base where clause: featured, active, and currently valid
    const where: Prisma.CouponWhereInput = {
      isFeatured: true,
      isActive: true,
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gt: now } },
      ],
    };

    if (type === "FLAT" || type === "PERCENTAGE") {
      where.type = type;
    }

    if (scope === "platform") {
      where.vendorId = null;
    } else if (scope === "vendor") {
      where.vendorId = { not: null };
    }

    if (expiring === "soon") {
      where.validUntil = { gt: now, lte: sevenDaysFromNow };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minOrderAmount: true,
        maxDiscount: true,
        usageLimit: true,
        usageCount: true,
        perUserLimit: true,
        validFrom: true,
        validUntil: true,
        vendorId: true,
        vendor: {
          select: {
            businessName: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: [
        { value: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
    });

    // Compute isExpiringSoon and convert Decimal fields
    const deals = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toNumber(),
      minOrderAmount: coupon.minOrderAmount?.toNumber() ?? null,
      maxDiscount: coupon.maxDiscount?.toNumber() ?? null,
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom.toISOString(),
      validUntil: coupon.validUntil?.toISOString() ?? null,
      isExpiringSoon: coupon.validUntil
        ? coupon.validUntil > now && coupon.validUntil <= sevenDaysFromNow
        : false,
      vendor: coupon.vendor
        ? {
            businessName: coupon.vendor.businessName,
            slug: coupon.vendor.slug,
            logo: coupon.vendor.logo,
          }
        : null,
    }));

    // Stats
    const stats = {
      total: deals.length,
      platformDeals: deals.filter((d) => d.vendor === null).length,
      vendorDeals: deals.filter((d) => d.vendor !== null).length,
      expiringSoon: deals.filter((d) => d.isExpiringSoon).length,
    };

    return NextResponse.json({
      success: true,
      data: { deals, stats },
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
