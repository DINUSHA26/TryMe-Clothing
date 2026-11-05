import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";
import { resolveWebsiteEntity } from "@/lib/website-entity-helper";

/**
 * GET /api/vendor/services/inquiries
 * List all service inquiries for the current Vendor or AdsSeller
 */
export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const where: any = {};
    if (target.type === "VENDOR") {
      where.vendorId = target.entity.id;
    } else {
      where.adsSellerId = target.entity.id;
    }

    const inquiries = await (prisma as any).serviceInquiry.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            priceType: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: inquiries,
    });
  } catch (error: any) {
    console.error("Error fetching service inquiries:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/services/inquiries
 * Update inquiry status or delete inquiry
 */
export async function PATCH(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const target = await resolveWebsiteEntity(userId);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Vendor or seller account not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { inquiryId, status, action } = body;

    if (!inquiryId) {
      return NextResponse.json(
        { success: false, error: "Inquiry ID is required" },
        { status: 400 }
      );
    }

    const existing = await (prisma as any).serviceInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const isOwner =
      (target.vendorId && existing.vendorId === target.vendorId) ||
      (target.adsSellerId && existing.adsSellerId === target.adsSellerId);

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not your inquiry" },
        { status: 403 }
      );
    }

    if (action === "DELETE") {
      await (prisma as any).serviceInquiry.delete({
        where: { id: inquiryId },
      });
      return NextResponse.json({
        success: true,
        message: "Inquiry deleted successfully",
      });
    }

    const updated = await (prisma as any).serviceInquiry.update({
      where: { id: inquiryId },
      data: {
        status: status || "CONTACTED",
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Inquiry marked as ${status || "CONTACTED"}`,
    });
  } catch (error: any) {
    console.error("Error updating service inquiry:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
