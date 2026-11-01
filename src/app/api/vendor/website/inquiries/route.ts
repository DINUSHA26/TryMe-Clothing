import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function PATCH(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      userId = getAuthUser(request)?.userId || null;
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    const adsSeller = !vendor
      ? await (prisma as any).adsSeller.findUnique({ where: { userId } })
      : null;

    if (!vendor && !adsSeller) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    const whereClause = vendor ? { vendorId: vendor.id } : { adsSellerId: adsSeller.id };
    const config = await (prisma as any).vendorWebsiteConfig.findFirst({ where: whereClause });
    if (!config) {
      return NextResponse.json({ success: false, error: "Website config not found" }, { status: 404 });
    }

    const body = await request.json();
    const { inquiryId, status, action } = body;

    const existingContact = (config.contactSection as any) || {};
    const existingInquiries: any[] = Array.isArray(existingContact.inquiries)
      ? existingContact.inquiries
      : [];

    let updatedInquiries: any[];
    if (action === "DELETE") {
      updatedInquiries = existingInquiries.filter((inq) => inq.id !== inquiryId);
    } else {
      updatedInquiries = existingInquiries.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: status || "CONTACTED" } : inq
      );
    }

    await (prisma as any).vendorWebsiteConfig.update({
      where: { id: config.id },
      data: {
        contactSection: {
          ...existingContact,
          inquiries: updatedInquiries,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { inquiries: updatedInquiries },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

