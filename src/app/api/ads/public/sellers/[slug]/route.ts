import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const seller = await prisma.adsSeller.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        servicePages: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!seller || seller.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Storefront not found or suspended." },
        { status: 404 }
      );
    }

    // Get active ads from this seller
    const ads = await prisma.classifiedAd.findMany({
      where: {
        sellerId: seller.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, icon: true } },
        subCategory: { select: { name: true } },
        seller: { select: { businessName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        seller,
        servicePages: seller.servicePages,
        ads,
      },
    });
  } catch (error) {
    console.error("Error loading seller storefront data:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while loading storefront details." },
      { status: 500 }
    );
  }
}
