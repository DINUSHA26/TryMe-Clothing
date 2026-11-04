/**
 * Vendor update entire order status API
 * PATCH /api/vendor/orders/[orderId]/status
 * Updates status for all items in this order belonging to the vendor simultaneously
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateOrderItemStatusSchema } from "@/lib/validations/order";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";
import { emailService } from "@/lib/email";

async function updateParentOrderStatus(orderId: string, tx: any): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const itemStatuses = order.items.map((i: any) => i.status);
  const uniqueStatuses = [...new Set(itemStatuses)];

  let newStatus = order.status;

  if (uniqueStatuses.length === 1) {
    const commonStatus = uniqueStatuses[0] as string;
    if (
      [
        "PENDING_VERIFICATION",
        "PAYMENT_CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ].includes(commonStatus)
    ) {
      newStatus = commonStatus;
    }
  } else {
    if (itemStatuses.some((s: string) => s === "PAYMENT_CONFIRMED")) {
      newStatus = "PAYMENT_CONFIRMED";
    } else if (itemStatuses.some((s: string) => s === "PROCESSING")) {
      newStatus = "PROCESSING";
    } else if (itemStatuses.some((s: string) => s === "SHIPPED")) {
      newStatus = "SHIPPED";
    } else if (itemStatuses.every((s: string) => s === "DELIVERED")) {
      newStatus = "DELIVERED";
    } else if (itemStatuses.every((s: string) => s === "COMPLETED")) {
      newStatus = "COMPLETED";
    }
  }

  if (newStatus !== order.status) {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(newStatus === "DELIVERED" || newStatus === "COMPLETED"
          ? { deliveryConfirmedAt: new Date() }
          : {}),
        ...(newStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        note: "Order status updated based on item statuses",
        createdBy: null,
      },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = requireVendor(request);
    const { orderId } = await params;

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

    const body = await request.json();
    const validation = updateOrderItemStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, trackingNumber, trackingUrl, note } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        items: {
          where: { vendorId },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items found in this order for your store" },
        { status: 403 }
      );
    }

    const isWebsiteOrder =
      order.orderNumber.startsWith("WEB-") ||
      (order.shippingAddressJson as any)?.orderSource === "VENDOR_WEBSITE";

    if (!isWebsiteOrder) {
      if (status === "SHIPPED" && (!trackingNumber || trackingNumber.trim().length < 3)) {
        return NextResponse.json(
          { success: false, error: "Tracking number is required when marking order as shipped" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      const itemUpdateData: any = {
        status,
      };

      if (status === "SHIPPED") {
        if (trackingNumber) itemUpdateData.trackingNumber = trackingNumber.trim();
        if (trackingUrl) itemUpdateData.trackingUrl = trackingUrl.trim();
        itemUpdateData.shippedAt = new Date();
      }

      // 1. Update all items belonging to this vendor
      for (const item of order.items) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: itemUpdateData,
        });

        // If website order is cancelled, restore stock
        if (isWebsiteOrder && status === "CANCELLED" && item.status !== "CANCELLED") {
          if (item.variantId) {
            await tx.productVariant
              .update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              })
              .catch(() => {});
          }
          await tx.product
            .update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
            .catch(() => {});
        }
      }

      // 2. If website order payment is confirmed or completed, update Payment records
      if (isWebsiteOrder && ["PAYMENT_CONFIRMED", "COMPLETED", "DELIVERED"].includes(status)) {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: "COMPLETED", paidAt: new Date() },
        });
      }

      // 3. Status History Entry
      const historyNote =
        status === "SHIPPED"
          ? `Entire order (${order.items.length} items) marked as SHIPPED by vendor${
              trackingNumber ? ` (Tracking: ${trackingNumber})` : ""
            }${note ? `\nNote: ${note}` : ""}`
          : `Entire order (${order.items.length} items) marked as ${status.replace(/_/g, " ")} by vendor${
              note ? `\nNote: ${note}` : ""
            }`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: status as any,
          note: historyNote,
          createdBy: null,
        },
      });

      // 4. Update parent order status
      if (isWebsiteOrder) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status,
            ...(status === "DELIVERED" || status === "COMPLETED"
              ? { deliveryConfirmedAt: new Date() }
              : {}),
            ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
          },
        });
      } else {
        await updateParentOrderStatus(order.id, tx);
      }
    });

    // Send customer notification
    try {
      const customerUserId = order.customer?.user?.id;
      if (customerUserId) {
        const notificationType =
          status === "SHIPPED"
            ? NotificationType.ORDER_ITEM_SHIPPED
            : NotificationType.ORDER_ITEM_PROCESSING;

        await createNotification({
          userId: customerUserId,
          type: notificationType,
          title: status === "SHIPPED" ? "Order Shipped" : "Order Status Updated",
          message: `Your order #${order.orderNumber} has been updated to ${status.replace(
            /_/g,
            " "
          )}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}.`,
          link: `/orders/${order.id}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingNumber: trackingNumber || undefined,
          },
        });
      }
    } catch {}

    // Trigger transactional emails asynchronously
    (async () => {
      try {
        const customerEmail =
          order.customer?.user?.email ||
          (order.shippingAddressJson as any)?.email;
        const customerName =
          `${order.customer?.user?.firstName || ""} ${
            order.customer?.user?.lastName || ""
          }`.trim() ||
          (order.shippingAddressJson as any)?.fullName ||
          "Customer";

        if (customerEmail && !customerEmail.endsWith("@website.tryme.lk")) {
          const firstItemName = (order.items[0]?.productSnapshot as any)?.name || "your items";
          const vendorName =
            (order.items[0]?.productSnapshot as any)?.vendorName ||
            vendorRecord.businessName ||
            "Vendor";

          const productLabel =
            order.items.length > 1
              ? `${firstItemName} + ${order.items.length - 1} more item(s)`
              : firstItemName;

          if (status === "PROCESSING") {
            await emailService.sendOrderItemProcessingEmail(customerEmail, {
              customerName,
              orderNumber: order.orderNumber,
              productName: productLabel,
              vendorName,
              orderLink: `/orders/${order.id}`,
            });
          } else if (status === "SHIPPED") {
            await emailService.sendOrderItemShippedEmail(customerEmail, {
              customerName,
              orderNumber: order.orderNumber,
              productName: productLabel,
              vendorName,
              trackingNumber: trackingNumber || undefined,
              orderLink: `/orders/${order.id}`,
            });
          }
        }
      } catch {}
    })();

    return NextResponse.json({
      success: true,
      message: `All ${order.items.length} items in order updated to ${status.replace(/_/g, " ")}`,
      status,
      itemsUpdated: order.items.length,
    });
  } catch (error) {
    console.error("[Vendor Update Entire Order Status] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update order status",
      },
      { status: 500 }
    );
  }
}
