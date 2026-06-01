import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;

    const ad = await prisma.classifiedAd.findUnique({
      where: { id: adId },
      include: {
        category: {
          select: { name: true, slug: true, icon: true },
        },
        subCategory: {
          include: {
            fieldDefinitions: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        seller: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!ad || ad.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Classified ad not found or inactive." },
        { status: 404 }
      );
    }

    // Increment page views in background
    try {
      await prisma.classifiedAd.update({
        where: { id: adId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    } catch (err) {
      console.error("Failed to increment ad page views:", err);
    }

    return NextResponse.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error("Error fetching classified ad details:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while loading ad details." },
      { status: 500 }
    );
  }
}
