/**
 * Cancel order API
 * POST /api/orders/[orderId]/cancel - Cancel order (within 24h, before shipping)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { cancelOrderSchema } from "@/lib/validations/order";
import { validateStatusTransition } from "@/lib/utils/order";
import { refundOrder } from "@/lib/utils/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

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
 * POST /api/orders/[orderId]/cancel
 * Cancel order within 24 hours of placement (before shipping)
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

    // Validate request body
    const body = await request.json();
    const validation = cancelOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to customer
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(
      order.status,
      "CANCELLED",
      "CUSTOMER",
      order.createdAt,
      order.deliveryConfirmedAt
    );

    if (!transitionValidation.isValid) {
      return NextResponse.json(
        { success: false, error: transitionValidation.error },
        { status: 400 }
      );
    }

    // Cancel order in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelReason: reason,
          cancelledAt: new Date(),
        },
      });

      // 2. Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "CANCELLED",
          note: `Order cancelled by customer: ${reason}`,
          createdBy: null, // Customer action
        },
      });

      // 3. Restore stock for all items
      for (const item of order.items) {
        if (item.variantId) {
          // Restore variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        } else {
          // Restore product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }

      // 4. If payment was completed, refund vendor wallets
      if (order.payment && order.payment.status === "COMPLETED") {
        await refundOrder(orderId, order.orderNumber, reason, tx);

        // Update payment status to REFUNDED
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "REFUNDED",
          },
        });
      }

      return updatedOrder;
    });

    console.log(`[Order] Order ${order.orderNumber} cancelled by customer:`, {
      orderId,
      reason,
      hadPayment: !!order.payment,
    });

    // Send notification to customer
    try {
      await createNotification({
        userId: order.customer.userId,
        type: NotificationType.ORDER_CANCELLED,
        title: "Order Cancelled",
        message: `Your order ${order.orderNumber} has been cancelled${order.payment && order.payment.status === "COMPLETED" ? ". Refund has been processed." : "."}`,
        link: `/orders/${orderId}`,
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          reason,
          refundAmount: order.payment && order.payment.status === "COMPLETED" ? order.totalAmount.toNumber() : undefined,
        },
      });
    } catch (notifError) {
      console.error("[Order Cancel] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
          cancelReason: result.cancelReason,
          cancelledAt: result.cancelledAt?.toISOString() || null,
        },
      },
    });
  } catch (error) {
    console.error("[Order Cancel] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 }
    );
  }
}
