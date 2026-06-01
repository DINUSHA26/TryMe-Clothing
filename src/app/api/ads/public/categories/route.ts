import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.adsCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            fieldDefinitions: {
              orderBy: { sortOrder: "asc" },
            },
            _count: {
              select: {
                ads: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Fetch ads categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories.",
      },
      { status: 500 }
    );
  }
}
