/**
 * Update order item status API (Ads Seller)
 * PATCH /api/ads-seller/orders/items/[orderItemId]/status
 * Ads Seller can update item status (full lifecycle for Website Direct Orders, PROCESSING/SHIPPED for TryMe Marketplace Orders)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateOrderItemStatusSchema } from "@/lib/validations/order";
import { validateStatusTransition } from "@/lib/utils/order";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";
import { emailService } from "@/lib/email";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

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
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const user = requireAdsSeller(request);
    const { orderItemId } = await params;

    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
    if (!sellerVendor) {
      return NextResponse.json(
        { success: false, error: "Ads seller not found" },
        { status: 404 }
      );
    }
    const vendorId = sellerVendor.vendor.id;

    const body = await request.json();
    const validation = updateOrderItemStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, trackingNumber, trackingUrl, note } = validation.data;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
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

    if (orderItem.vendorId !== vendorId) {
      return NextResponse.json(
        { success: false, error: "This item does not belong to you" },
        { status: 403 }
      );
    }

    const isWebsiteOrder =
      orderItem.order.orderNumber.startsWith("WEB-") ||
      (orderItem.order.shippingAddressJson as any)?.orderSource === "VENDOR_WEBSITE";

    if (!isWebsiteOrder) {
      // Standard TryMe Marketplace order validation
      if (status === "SHIPPED" && (!trackingNumber || trackingNumber.length < 3)) {
        return NextResponse.json(
          { success: false, error: "Tracking number is required when marking as shipped" },
          { status: 400 }
        );
      }

      const transitionValidation = validateStatusTransition(
        orderItem.status,
        status as any,
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
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status,
      };

      if (status === "SHIPPED") {
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (trackingUrl) updateData.trackingUrl = trackingUrl;
        updateData.shippedAt = new Date();
      }

      const updatedItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: updateData,
      });

      // If website order payment is confirmed or order completed, update Payment record status
      if (isWebsiteOrder && ["PAYMENT_CONFIRMED", "COMPLETED", "DELIVERED"].includes(status)) {
        await tx.payment.updateMany({
          where: { orderId: orderItem.orderId },
          data: { status: "COMPLETED", paidAt: new Date() },
        });
      }

      // If website order is cancelled, restore stock
      if (isWebsiteOrder && status === "CANCELLED" && orderItem.status !== "CANCELLED") {
        if (orderItem.variantId) {
          await tx.productVariant
            .update({
              where: { id: orderItem.variantId },
              data: { stock: { increment: orderItem.quantity } },
            })
            .catch(() => {});
        }
        await tx.product
          .update({
            where: { id: orderItem.productId },
            data: { stock: { increment: orderItem.quantity } },
          })
          .catch(() => {});
      }

      const historyNote =
        status === "SHIPPED"
          ? `Item shipped by seller${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}${
              note ? `\n${note}` : ""
            }`
          : `Item marked as ${status} by seller${note ? `\n${note}` : ""}`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: orderItem.orderId,
          status: status as any,
          note: historyNote,
          createdBy: null,
        },
      });

      await updateParentOrderStatus(orderItem.orderId, tx);

      return updatedItem;
    });

    // Send notification to customer if applicable
    try {
      const productSnapshot = orderItem.productSnapshot as any;
      const vendorName = productSnapshot?.vendorName || sellerVendor.vendor.businessName || "the store";
      const productName = productSnapshot?.name || "your item";

      const notificationType =
        status === "SHIPPED"
          ? NotificationType.ORDER_ITEM_SHIPPED
          : NotificationType.ORDER_ITEM_PROCESSING;

      const message =
        status === "SHIPPED"
          ? `Your order item "${productName}" from ${vendorName} has been shipped${
              trackingNumber ? ` (Tracking: ${trackingNumber})` : ""
            }.`
          : `Your order item "${productName}" from ${vendorName} status was updated to ${status.replace(
              /_/g,
              " "
            )}.`;

      await createNotification({
        userId: orderItem.order.customer.user.id,
        type: notificationType,
        title: status === "SHIPPED" ? "Item Shipped" : "Order Status Updated",
        message,
        link: `/orders/${orderItem.orderId}`,
        metadata: {
          orderId: orderItem.orderId,
          orderNumber: orderItem.order.orderNumber,
          orderItemId,
          productName,
          vendorName,
          trackingNumber: trackingNumber || undefined,
        },
      });
    } catch {}

    // Trigger transactional emails asynchronously
    (async () => {
      try {
        const productSnapshot = orderItem.productSnapshot as any;
        const vendorName = productSnapshot?.vendorName || sellerVendor.vendor.businessName || "the store";
        const productName = productSnapshot?.name || "your item";
        const customerEmail = orderItem.order.customer.user.email;
        const customerName =
          `${orderItem.order.customer.user.firstName || ""} ${
            orderItem.order.customer.user.lastName || ""
          }`.trim() || "Customer";

        if (customerEmail && !customerEmail.endsWith("@website.tryme.lk")) {
          if (status === "PROCESSING") {
            await emailService.sendOrderItemProcessingEmail(customerEmail, {
              customerName,
              orderNumber: orderItem.order.orderNumber,
              productName,
              vendorName,
              orderLink: `/orders/${orderItem.orderId}`,
            });
          } else if (status === "SHIPPED") {
            await emailService.sendOrderItemShippedEmail(customerEmail, {
              customerName,
              orderNumber: orderItem.order.orderNumber,
              productName,
              vendorName,
              trackingNumber: trackingNumber || undefined,
              orderLink: `/orders/${orderItem.orderId}`,
            });
          }
        }
      } catch {}
    })();

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
    console.error("[Ads Seller Update Status] Error:", error);
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

