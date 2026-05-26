/**
 * Admin override order status API
 * PATCH /api/admin/orders/[orderId]/status
 * Admin can override order status to any status with reason
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { overrideOrderStatusSchema } from "@/lib/validations/order";
import { releaseVendorFunds } from "@/lib/utils/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * PATCH /api/admin/orders/[orderId]/status
 * Override order status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminUser = requireAdmin(request);
    const adminUserId = adminUser.userId;

    const { orderId } = await params;

    // Validate request body
    const body = await request.json();
    const validation = overrideOrderStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, reason } = validation.data;

    // Fetch order with customer info for notification
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if status is actually changing
    if (order.status === status) {
      return NextResponse.json(
        { success: false, error: "Order is already in this status" },
        { status: 400 }
      );
    }

    // Determine if this override should release vendor funds.
    // Release when admin sets DELIVERED (or legacy DELIVERY_CONFIRMED) and
    // funds have not been released yet (deliveryConfirmedAt is null).
    const shouldReleaseFunds =
      (status === "DELIVERED" || status === "DELIVERY_CONFIRMED") &&
      order.deliveryConfirmedAt === null;

    // Update order status in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          // Set special fields based on status
          ...(status === "CANCELLED" && {
            cancelReason: reason,
            cancelledAt: new Date(),
          }),
          ...((status === "DELIVERED" || status === "DELIVERY_CONFIRMED") && {
            deliveryConfirmedAt: new Date(),
          }),
        },
      });

      // 2. Create status history with admin user ID
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note: `Admin override: ${reason}`,
          createdBy: adminUserId,
        },
      });

      // 3. Update all order items to match parent status
      // (Admin override affects all items)
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status },
      });

      // If transitioning to CANCELLED, restore stock
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
        });

        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }
      }

      // 4. Release vendor funds if marking as delivered and funds not yet released
      if (shouldReleaseFunds) {
        await releaseVendorFunds(orderId, order.orderNumber, tx);
      }

      return updatedOrder;
    });

    console.log(`[Admin] Order ${order.orderNumber} status overridden to ${status}:`, {
      orderId,
      adminUserId,
      reason,
      previousStatus: order.status,
    });

    // Send notification to customer about status override
    try {
      await createNotification({
        userId: order.customer.user.id,
        type: NotificationType.ORDER_STATUS_OVERRIDE,
        title: "Order Status Updated",
        message: `Your order ${order.orderNumber} status has been updated to ${status} by admin.${reason ? ` Reason: ${reason}` : ""}`,
        link: `/orders/${orderId}`,
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
        },
      });
    } catch (notifError) {
      console.error("[Admin Override Status] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
          previousStatus: order.status,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Override Status] Error:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to override status",
      },
      { status: 500 }
    );
  }
}
