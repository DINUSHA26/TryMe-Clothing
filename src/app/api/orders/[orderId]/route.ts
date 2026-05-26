/**
 * Order details API
 * GET /api/orders/[orderId] - Fetch order details with status history and actions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { calculateOrderActions } from "@/lib/utils/order";

import { getOrderDetails } from "@/lib/services/order-service";

/**
 * Helper to get authenticated user info
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{
  userId: string;
  role: string;
  customerId?: string;
  vendorId?: string;
} | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || !userRole) {
    return null;
  }

  // For any role, try to get their customer profile if it exists
  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  // For vendors, get their vendor profile too
  let vendorId: string | undefined;
  if (userRole === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });
    vendorId = vendor?.id;
  }

  return {
    userId,
    role: userRole,
    customerId: customer?.id,
    vendorId
  };
}

/**
 * GET /api/orders/[orderId]
 * Fetch order details with payment info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    const data = await getOrderDetails(orderId, auth);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Order details API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order details" },
      { status: error.message === "Order not found" ? 404 : 500 }
    );
  }
}
