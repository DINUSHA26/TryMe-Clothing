import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStandaloneSiteData } from "@/lib/site-resolver";

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
    const {
      customerName,
      customerPhone,
      customerEmail,
      itemType,
      itemId,
      itemName,
      itemPrice,
      quantity,
      message,
      preferredChannel,
    } = body;

    if (!customerName?.trim() || (!customerPhone?.trim() && !customerEmail?.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter your name and phone number or email" },
        { status: 400 }
      );
    }

    const newInquiry = {
      id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || "",
      customerEmail: customerEmail?.trim() || "",
      itemType: itemType || "GENERAL",
      itemId: itemId || null,
      itemName: itemName || "General Store Inquiry",
      itemPrice: itemPrice || null,
      quantity: Number(quantity) || 1,
      message: message?.trim() || "",
      preferredChannel: preferredChannel || "WHATSAPP",
      status: "NEW",
      createdAt: new Date().toISOString(),
    };

    if (siteData.config?.id) {
      const existingContact = (siteData.config.contactSection as any) || {};
      const existingInquiries = Array.isArray(existingContact.inquiries)
        ? existingContact.inquiries
        : [];

      await (prisma as any).vendorWebsiteConfig.update({
        where: { id: siteData.config.id },
        data: {
          contactSection: {
            ...existingContact,
            inquiries: [newInquiry, ...existingInquiries],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: newInquiry,
    });
  } catch (error: any) {
    console.error("Error submitting website inquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}

