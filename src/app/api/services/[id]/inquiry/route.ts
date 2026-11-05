import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/services/[id]/inquiry
 * Public endpoint to submit an inquiry for a service (from TryMe Marketplace or Website)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await (prisma as any).websiteService.findUnique({
      where: { id },
      include: {
        vendor: {
          select: { id: true, businessName: true, businessPhone: true, userId: true },
        },
        adsSeller: {
          select: { id: true, businessName: true, phone: true, userId: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      message,
      preferredChannel,
      source, // "TRYME_MARKETPLACE" | "VENDOR_WEBSITE"
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!customerPhone?.trim() && !customerEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a phone number or email" },
        { status: 400 }
      );
    }

    const inquirySource = source === "VENDOR_WEBSITE" ? "VENDOR_WEBSITE" : "TRYME_MARKETPLACE";

    // 1. Create in dedicated ServiceInquiry table
    const inquiry = await (prisma as any).serviceInquiry.create({
      data: {
        serviceId: service.id,
        vendorId: service.vendorId,
        adsSellerId: service.adsSellerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        message: message?.trim() || `Inquiry regarding service: ${service.name}`,
        preferredChannel: preferredChannel || "WHATSAPP",
        source: inquirySource,
        status: "NEW",
      },
    });

    // 2. Also sync to VendorWebsiteConfig so legacy inquiry views also receive it
    try {
      const configWhere: any = {};
      if (service.vendorId) configWhere.vendorId = service.vendorId;
      else if (service.adsSellerId) configWhere.adsSellerId = service.adsSellerId;

      const websiteConfig = await (prisma as any).vendorWebsiteConfig.findFirst({
        where: configWhere,
      });

      if (websiteConfig) {
        const contactSec = (websiteConfig.contactSection as any) || {};
        const existingInquiries = Array.isArray(contactSec.inquiries) ? contactSec.inquiries : [];
        const syncItem = {
          id: inquiry.id,
          customerName: inquiry.customerName,
          customerPhone: inquiry.customerPhone || "",
          customerEmail: inquiry.customerEmail || "",
          itemType: "SERVICE",
          itemId: service.id,
          itemName: service.name,
          itemPrice: service.price ? `Rs. ${service.price}` : "Custom",
          quantity: 1,
          message: inquiry.message,
          preferredChannel: inquiry.preferredChannel,
          source: inquirySource,
          status: "NEW",
          createdAt: inquiry.createdAt.toISOString(),
        };

        await (prisma as any).vendorWebsiteConfig.update({
          where: { id: websiteConfig.id },
          data: {
            contactSection: {
              ...contactSec,
              inquiries: [syncItem, ...existingInquiries],
            },
          },
        });
      }
    } catch (syncErr) {
      console.warn("Failed to sync service inquiry to website config:", syncErr);
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: "Inquiry submitted successfully",
    });
  } catch (error: any) {
    console.error("Error creating service inquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
