/**
 * Update order item status API (Vendor)
 * PATCH /api/vendor/orders/items/[orderItemId]/status
 * Vendor can update item status to PROCESSING or SHIPPED (with tracking)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateOrderItemStatusSchema } from "@/lib/validations/order";
import { validateStatusTransition } from "@/lib/utils/order";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

/**
 * Update parent order status based on all items
 * If all items have the same status, update parent order
 */
async function updateParentOrderStatus(orderId: string, tx: any): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const itemStatuses = order.items.map((i: any) => i.status);
  const uniqueStatuses = [...new Set(itemStatuses)];

  let newStatus = order.status;

  // If all items have the same status, update parent order
  if (uniqueStatuses.length === 1) {
    const commonStatus = uniqueStatuses[0] as string;
    if (["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(commonStatus)) {
      newStatus = commonStatus;
    }
  } else {
    // Multiple statuses - determine the "least advanced" status
    // Priority: PAYMENT_CONFIRMED < PROCESSING < SHIPPED < DELIVERED
    if (itemStatuses.some((s: string) => s === "PAYMENT_CONFIRMED")) {
      newStatus = "PAYMENT_CONFIRMED";
    } else if (itemStatuses.some((s: string) => s === "PROCESSING")) {
      newStatus = "PROCESSING";
    } else if (itemStatuses.some((s: string) => s === "SHIPPED")) {
      newStatus = "SHIPPED";
    } else if (itemStatuses.every((s: string) => s === "DELIVERED")) {
      newStatus = "DELIVERED";
    }
  }

  // Update order status if it changed
  if (newStatus !== order.status) {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        note: "Order status updated based on item statuses",
        createdBy: null, // System action
      },
    });
  }
}

/**
 * PATCH /api/vendor/orders/items/[orderItemId]/status
 * Update order item status (vendor can only update to PROCESSING or SHIPPED)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    // Auth check
    const user = requireVendor(request);

    const { orderItemId } = await params;

    // Look up vendor record (TokenPayload has no vendorId field)
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    // Validate request body
    const body = await request.json();
    const validation = updateOrderItemStatusSchema.safeParse(body);

    if (!validation.success) {
      console.error("[Vendor Update Status] Validation failed:", validation.error.format());
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, trackingNumber, trackingUrl, note } = validation.data;

    // Fetch order item with customer info for notification
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { success: false, error: "Order item not found" },
        { status: 404 }
      );
    }

    // Verify item belongs to vendor
    if (orderItem.vendorId !== vendorId) {
      return NextResponse.json(
        { success: false, error: "This item does not belong to you" },
        { status: 403 }
      );
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(
      orderItem.status,
      status,
      "VENDOR",
      orderItem.order.createdAt,
      null
    );

    if (!transitionValidation.isValid) {
      return NextResponse.json(
        { success: false, error: transitionValidation.error },
        { status: 400 }
      );
    }

    // Update item status in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {
        status,
      };

      if (status === "SHIPPED") {
        updateData.trackingNumber = trackingNumber;
        updateData.trackingUrl = trackingUrl;
        updateData.shippedAt = new Date();
      }

      // 1. Update order item
      const updatedItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: updateData,
      });

      // 2. Create order status history
      const historyNote = status === "SHIPPED"
        ? `Item shipped by vendor${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}${note ? `\n${note}` : ""}`
        : `Item marked as ${status} by vendor${note ? `\n${note}` : ""}`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: orderItem.orderId,
          status,
          note: historyNote,
          createdBy: null, // Vendor action (could store vendorId in metadata)
        },
      });

      // 3. Update parent order status if needed
      await updateParentOrderStatus(orderItem.orderId, tx);

      return updatedItem;
    });

    console.log(`[Vendor] Order item ${orderItemId} status updated to ${status}:`, {
      orderId: orderItem.orderId,
      vendorId,
      trackingNumber,
    });

    // Send notification to customer
    try {
      const productSnapshot = orderItem.productSnapshot as any;
      const vendorName = productSnapshot?.vendorName || "the vendor";
      const productName = productSnapshot?.name || "your item";

      const notificationType = status === "SHIPPED"
        ? NotificationType.ORDER_ITEM_SHIPPED
        : NotificationType.ORDER_ITEM_PROCESSING;

      const message = status === "SHIPPED"
        ? `Your order item "${productName}" from ${vendorName} has been shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}.`
        : `Your order item "${productName}" from ${vendorName} is being processed.`;

      await createNotification({
        userId: orderItem.order.customer.user.id,
        type: notificationType,
        title: status === "SHIPPED" ? "Item Shipped" : "Item Processing",
        message,
        link: `/orders/${orderItem.orderId}`,
        metadata: {
          orderId: orderItem.orderId,
          orderNumber: orderItem.order.orderNumber,
          orderItemId,
          productName: productName,
          vendorName: vendorName,
          trackingNumber: trackingNumber || undefined,
        },
      });
    } catch (notifError) {
      console.error("[Vendor Update Status] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderItem: {
          id: result.id,
          status: result.status,
          trackingNumber: result.trackingNumber,
          trackingUrl: result.trackingUrl,
          shippedAt: result.shippedAt?.toISOString() || null,
        },
      },
    });
  } catch (error) {
    console.error("[Vendor Update Status] Error:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update status",
      },
      { status: 500 }
    );
  }
}
