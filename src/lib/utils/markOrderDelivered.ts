/**
 * Shared utility for marking an order as DELIVERED and releasing vendor funds.
 *
 * Used by:
 * - Customer confirm-delivery API  (triggeredBy: "customer")
 * - Admin status override           (triggeredBy: "admin")
 * - Auto-tracking polling service   (triggeredBy: "tracking")
 *
 * CRITICAL: This is the single source of truth for the escrow-release step.
 * All three entry points must go through this function to ensure funds
 * are always released exactly once.
 */

import { prisma } from "@/lib/prisma";
import { releaseVendorFunds } from "@/lib/utils/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

export type DeliveryTrigger = "customer" | "admin" | "tracking";

export interface MarkDeliveredResult {
  success: boolean;
  message: string;
  alreadyDelivered?: boolean;
}

/**
 * Mark an order as DELIVERED and release vendor funds from escrow.
 *
 * Idempotent: calling on an already-delivered order returns success
 * without re-releasing funds.
 *
 * @param orderId      - The order to mark as delivered
 * @param triggeredBy  - Who/what triggered this (for audit trail)
 * @param adminUserId  - Admin user ID (only when triggeredBy = "admin")
 */
export async function markOrderDelivered(
  orderId: string,
  triggeredBy: DeliveryTrigger,
  adminUserId?: string
): Promise<MarkDeliveredResult> {
  // 1. Fetch order with customer info for notifications
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
    return { success: false, message: "Order not found" };
  }

  // 2. Idempotency: already delivered or confirmed — return success without re-releasing
  if (
    order.deliveryConfirmedAt !== null ||
    ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(order.status)
  ) {
    return {
      success: true,
      message: "Order already delivered",
      alreadyDelivered: true,
    };
  }

  // 3. Validate current status — must be SHIPPED to proceed
  if (order.status !== "SHIPPED") {
    return {
      success: false,
      message: `Order must be in SHIPPED status to mark as delivered (current: ${order.status})`,
    };
  }

  // 4. Audit note for status history
  const note =
    triggeredBy === "customer"
      ? "Customer confirmed delivery"
      : triggeredBy === "admin"
      ? "Admin confirmed delivery"
      : "Auto-delivered: carrier tracking confirmed";

  // 5. Atomic transaction: update status + set timestamp + release vendor funds
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        deliveryConfirmedAt: new Date(),
      },
    });

    await tx.orderItem.updateMany({
      where: { 
        orderId,
        status: { notIn: ["CANCELLED", "RETURNED", "RETURN_REQUESTED", "DISPUTED"] }
      },
      data: { status: "DELIVERED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "DELIVERED",
        note,
        createdBy: adminUserId || null,
      },
    });

    // CRITICAL: Move funds from pendingBalance → availableBalance
    await releaseVendorFunds(orderId, order.orderNumber, tx);
  });

  // 6. Notify customer (non-blocking — failure must not break the delivery confirmation)
  try {
    const message =
      triggeredBy === "customer"
        ? `Thank you for confirming delivery of order ${order.orderNumber}. Your order is now complete.`
        : triggeredBy === "admin"
        ? `Your order ${order.orderNumber} has been confirmed as delivered by our team.`
        : `Your order ${order.orderNumber} has been confirmed as delivered by the carrier.`;

    await createNotification({
      userId: order.customer.user.id,
      type: NotificationType.ORDER_DELIVERY_CONFIRMED,
      title: "Delivery Confirmed",
      message,
      link: `/orders/${orderId}`,
      metadata: {
        orderId,
        orderNumber: order.orderNumber,
      },
    });
  } catch (notifErr) {
    console.error(
      "[markOrderDelivered] Notification failed (non-critical):",
      notifErr
    );
  }

  console.log(
    `[Order] DELIVERED: ${order.orderNumber} (triggered by: ${triggeredBy})`
  );

  return {
    success: true,
    message: "Order marked as delivered and funds released",
  };
}
