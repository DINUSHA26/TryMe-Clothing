/**
 * Set address as default
 * PATCH /api/addresses/[id]/default
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { formatAddress } from "@/lib/utils/address";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || userRole !== UserRole.CUSTOMER) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  return customer?.id || null;
}

/**
 * PATCH /api/addresses/[id]/default
 * Set address as default (unsets all others)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: addressId } = await params;

    // Verify address belongs to customer
    const existingAddress = await prisma.shippingAddress.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress || existingAddress.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Unset all defaults
      await tx.shippingAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });

      // Set this as default
      const updatedAddress = await tx.shippingAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return updatedAddress;
    });

    return NextResponse.json({
      success: true,
      data: { address: formatAddress(result) },
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set default address" },
      { status: 500 }
    );
  }
}
