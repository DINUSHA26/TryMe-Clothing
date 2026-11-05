import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services/[slug]
 * Returns full details for a public service (query by slug or id)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await (prisma as any).websiteService.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
        isDisabledByAdmin: false,
        showOnMarketplace: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true, image: true },
        },
        subCategory: {
          select: { id: true, name: true, slug: true, icon: true, image: true },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
            banner: true,
            businessPhone: true,
            businessEmail: true,
            businessAddress: true,
            description: true,
            isShopOpen: true,
          },
        },
        adsSeller: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            phone: true,
            aboutContent: true,
            contactInfo: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found or is currently not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error("Error fetching service details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load service details" },
      { status: 500 }
    );
  }
}
