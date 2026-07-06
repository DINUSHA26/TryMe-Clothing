/**
 * Address API endpoints for specific address
 * PUT /api/addresses/[id] - Update address
 * DELETE /api/addresses/[id] - Delete address
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateAddressSchema } from "@/lib/validations/address";
import { formatAddress } from "@/lib/utils/address";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return null;
  }

  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    try {
      customer = await prisma.customer.create({
        data: { userId },
      });
    } catch (e) {
      console.error("Failed to auto-create customer record for address management:", e);
      return null;
    }
  }

  return customer.id;
}

/**
 * PUT /api/addresses/[id]
 */
export async function PUT(
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

    const body = await request.json();
    const validation = updateAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset all other defaults
    if (data.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { customerId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.shippingAddress.update({
      where: { id: addressId },
      data,
    });

    return NextResponse.json({
      success: true,
      data: { address: formatAddress(updatedAddress) },
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update address" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/addresses/[id]
 */
export async function DELETE(
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

    // If deleting default address, set another as default
    if (existingAddress.isDefault) {
      const otherAddress = await prisma.shippingAddress.findFirst({
        where: {
          customerId,
          id: { not: addressId },
        },
        orderBy: { createdAt: "desc" },
      });

      if (otherAddress) {
        await prisma.shippingAddress.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.shippingAddress.delete({
      where: { id: addressId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Address deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
