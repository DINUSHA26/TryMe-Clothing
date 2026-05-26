/**
 * Confirm delivery API
 * POST /api/orders/[orderId]/confirm-delivery
 *
 * Customer confirms receipt of their order.
 * Sets order status to DELIVERED and releases vendor funds from escrow.
 * Idempotent: safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { markOrderDelivered } from "@/lib/utils/markOrderDelivered";

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
 * POST /api/orders/[orderId]/confirm-delivery
 * Customer confirms delivery → order becomes DELIVERED → vendor funds released
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
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
        deliveryConfirmedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Delegate to shared utility (handles idempotency, validation, fund release, notification)
    const result = await markOrderDelivered(orderId, "customer");

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
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
        deliveryConfirmedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder!.id,
          orderNumber: updatedOrder!.orderNumber,
          status: updatedOrder!.status,
          deliveryConfirmedAt:
            updatedOrder!.deliveryConfirmedAt?.toISOString() || null,
        },
        alreadyDelivered: result.alreadyDelivered || false,
      },
    });
  } catch (error) {
    console.error("[Order Confirm Delivery] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to confirm delivery",
      },
      { status: 500 }
    );
  }
}
