/**
 * Address API endpoints
 * GET /api/addresses - List all addresses for customer
 * POST /api/addresses - Create new address
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { createAddressSchema } from "@/lib/validations/address";
import { formatAddress } from "@/lib/utils/address";

/**
 * Helper: Require customer authentication — allow any authenticated user
 */
async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId) {
    return null;
  }

  // Find or create customer record for this user
  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    try {
      customer = await prisma.customer.create({
        data: { userId },
      });
    } catch (e) {
      console.error("Failed to create customer record:", e);
      return null;
    }
  }

  return customer.id;
}

/**
 * GET /api/addresses
 * Fetch all addresses for authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await prisma.shippingAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: "desc" }, // Default first
        { createdAt: "desc" },
      ],
    });

    const formattedAddresses = addresses.map(formatAddress);
    const defaultAddress = formattedAddresses.find((a) => a.isDefault) || null;

    return NextResponse.json({
      success: true,
      data: {
        addresses: formattedAddresses,
        defaultAddress,
      },
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses
 * Create new address for authenticated customer
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: (validation.error as any).errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset all other defaults
    if (data.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    } else {
      // If no default exists, make this one default
      const existingDefault = await prisma.shippingAddress.findFirst({
        where: { customerId, isDefault: true },
      });

      if (!existingDefault) {
        data.isDefault = true;
      }
    }

    const address = await prisma.shippingAddress.create({
      data: {
        customerId,
        ...data,
        country: "Sri Lanka", // Always Sri Lanka
      },
    });

    return NextResponse.json({
      success: true,
      data: { address: formatAddress(address) },
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create address" },
      { status: 500 }
    );
  }
}
