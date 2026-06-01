import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { id } = await params;

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const page = await prisma.adsSellerPage.findUnique({
      where: { id },
    });

    if (!page || page.sellerId !== seller.id) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, isPublished, sortOrder } = body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    if (title && title !== page.title) {
      updateData.title = title;
      // Re-generate slug if title changed
      let slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      if (!slug) {
        slug = "page";
      }

      let existingPage = await prisma.adsSellerPage.findFirst({
        where: {
          sellerId: seller.id,
          slug,
          id: { not: id },
        },
      });

      let counter = 1;
      const baseSlug = slug;
      while (existingPage) {
        slug = `${baseSlug}-${counter}`;
        existingPage = await prisma.adsSellerPage.findFirst({
          where: {
            sellerId: seller.id,
            slug,
            id: { not: id },
          },
        });
        counter++;
      }
      updateData.slug = slug;
    }

    const updatedPage = await prisma.adsSellerPage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Error updating custom page:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while updating custom page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { id } = await params;

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const page = await prisma.adsSellerPage.findUnique({
      where: { id },
    });

    if (!page || page.sellerId !== seller.id) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    await prisma.adsSellerPage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom page:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while deleting custom page" },
      { status: 500 }
    );
  }
}
