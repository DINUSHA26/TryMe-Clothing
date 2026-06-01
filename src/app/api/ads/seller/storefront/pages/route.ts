import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const pages = await prisma.adsSellerPage.findMany({
      where: { sellerId: seller.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Error fetching custom pages:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while loading pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, imageUrl, isPublished = true, sortOrder = 0 } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required fields" },
        { status: 400 }
      );
    }

    // Generate unique slug for this seller
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!slug) {
      slug = "page";
    }

    let existingPage = await prisma.adsSellerPage.findUnique({
      where: {
        sellerId_slug: {
          sellerId: seller.id,
          slug,
        },
      },
    });

    let counter = 1;
    const baseSlug = slug;
    while (existingPage) {
      slug = `${baseSlug}-${counter}`;
      existingPage = await prisma.adsSellerPage.findUnique({
        where: {
          sellerId_slug: {
            sellerId: seller.id,
            slug,
          },
        },
      });
      counter++;
    }

    const newPage = await prisma.adsSellerPage.create({
      data: {
        sellerId: seller.id,
        title,
        content,
        imageUrl,
        slug,
        isPublished,
        sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: newPage,
    });
  } catch (error) {
    console.error("Error creating custom page:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while creating custom page" },
      { status: 500 }
    );
  }
}
