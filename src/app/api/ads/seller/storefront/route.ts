import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        businessName: true,
        phone: true,
        aboutContent: true,
        contactInfo: true,
        slug: true,
        status: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: seller,
    });
  } catch (error) {
    console.error("Error loading seller storefront configuration:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while loading storefront settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const body = await request.json();
    const { businessName, aboutContent, contactInfo, phone } = body;

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const updatedSeller = await prisma.adsSeller.update({
      where: { id: seller.id },
      data: {
        businessName: businessName || seller.businessName,
        phone: phone || seller.phone,
        aboutContent: aboutContent !== undefined ? aboutContent : seller.aboutContent,
        contactInfo: contactInfo !== undefined ? contactInfo : seller.contactInfo || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSeller,
    });
  } catch (error) {
    console.error("Error updating seller storefront configuration:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while saving storefront settings" },
      { status: 500 }
    );
  }
}
