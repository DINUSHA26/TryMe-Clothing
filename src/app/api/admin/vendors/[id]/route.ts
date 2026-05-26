import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateVendorSchema } from "@/lib/validations/vendor";
import { emailService } from "@/lib/email";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/vendors/[id]
 * Get vendor details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Get vendor with relations
    const vendor = await prisma.vendor.findUnique({
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
            updatedAt: true,
          },
        },
        wallet: true,
        _count: {
          select: {
            products: true,
            orderItems: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching the vendor",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/vendors/[id]
 * Update vendor details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = updateVendorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // If email is being changed, check if it's already in use
    if (data.businessEmail && data.businessEmail !== existingVendor.businessEmail) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.businessEmail },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: "A user with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    // Update vendor
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.businessEmail && { businessEmail: data.businessEmail }),
        ...(data.businessPhone && { businessPhone: data.businessPhone }),
        ...(data.businessAddress !== undefined && {
          businessAddress: data.businessAddress,
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.commissionRate !== undefined && {
          commissionRate: data.commissionRate,
        }),
        ...(data.isShopOpen !== undefined && { isShopOpen: data.isShopOpen }),
        ...(data.shopClosedReason !== undefined && {
          shopClosedReason: data.shopClosedReason,
        }),
        ...(data.status && { status: data.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    // Send approval email if status changed to ACTIVE
    if (data.status === "ACTIVE" && existingVendor.status !== "ACTIVE") {
      try {
        await emailService.sendVendorApprovalEmail(
          updatedVendor.businessEmail,
          updatedVendor.businessName
        );
      } catch (error) {
        console.error("Failed to send vendor approval email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: { vendor: updatedVendor },
    });
  } catch (error) {
    console.error("Error updating vendor:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the vendor",
      },
      { status: 500 }
    );
  }
}
