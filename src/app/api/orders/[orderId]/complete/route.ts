/**
 * Complete Order API
 * POST /api/orders/[orderId]/complete
 *
 * Customer manually marks their order as completed.
 * Sets order status and eligible item statuses to COMPLETED.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { manualCompleteOrder } from "@/lib/utils/orderCompletion";

async function getAuthenticatedCustomer(request: NextRequest): Promise<{ customerId: string; userId: string } | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || userRole !== UserRole.CUSTOMER) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) return null;

  return { customerId: customer.id, userId };
}

/**
 * POST /api/orders/[orderId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuthenticatedCustomer(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Verify order exists and belongs to this customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.customerId !== auth.customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Verify order status
    if (!["DELIVERED", "DELIVERY_CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "Only delivered orders can be completed" },
        { status: 400 }
      );
    }

    const result = await manualCompleteOrder(orderId, auth.userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to complete order" },
        { status: 400 }
      );
    }

    // Re-fetch updated order for response
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder!.id,
          orderNumber: updatedOrder!.orderNumber,
          status: updatedOrder!.status,
        },
      },
    });
  } catch (error) {
    console.error("[Order Complete] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to complete order",
      },
      { status: 500 }
    );
  }
}
