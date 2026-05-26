import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendors
 * Public endpoint - Get all approved vendors
 */
export async function GET(request: NextRequest) {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE",
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        businessAddress: true,
        description: true,
        logo: true,
        banner: true,
        commissionRate: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDisabledByAdmin: false,
              },
            },
          },
        },
      },
      orderBy: {
        businessName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("[GET /api/vendors] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch vendors",
      },
      { status: 500 }
    );
  }
}
