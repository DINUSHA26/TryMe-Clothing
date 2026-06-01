import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { emailService } from "@/lib/email";
import { VendorStatus } from "@prisma/client";

/**
 * GET /api/admin/ads-sellers/[id]
 * Get details of a single ads seller
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(request);
    const { id } = params;

    const seller = await prisma.adsSeller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { startsAt: "desc" },
          include: {
            plan: true,
            payment: true,
          },
        },
        ads: {
          orderBy: { createdAt: "desc" },
          include: {
            subCategory: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: seller,
    });
  } catch (error) {
    console.error("Error fetching ads seller details:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching seller details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ads-sellers/[id]
 * Verify, reject, suspend or activate an ads seller
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(request);
    const { id } = params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Status field is required" },
        { status: 400 }
      );
    }

    const seller = await prisma.adsSeller.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller not found" },
        { status: 404 }
      );
    }

    const previousStatus = seller.status;
    const newStatus = body.status as VendorStatus;

    // Update ads seller status
    const updatedSeller = await prisma.adsSeller.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    // Send verification email on approval
    if (newStatus === VendorStatus.ACTIVE && previousStatus === VendorStatus.PENDING) {
      try {
        await emailService.sendAdsSellerWelcomeEmail(
          seller.user.email!,
          seller.businessName || `${seller.user.firstName} ${seller.user.lastName}`,
          seller.user.email!
        );
      } catch (err) {
        console.error("Error sending welcome email to ads seller:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSeller,
    });
  } catch (error) {
    console.error("Error updating ads seller status:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while updating seller status" },
      { status: 500 }
    );
  }
}
