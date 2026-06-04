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
import { emailService } from "@/lib/email";

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
        payment: true,
        customer: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                businessEmail: true,
              },
            },
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

    // Trigger transactional emails asynchronously (non-blocking) based on new status
    (async () => {
      try {
        if (!order) return;
        const customerEmail = order.customer.user.email;
        const customerName = `${order.customer.user.firstName || ""} ${order.customer.user.lastName || ""}`.trim() || "Customer";

        if (status === "CANCELLED") {
          // 1. Send Cancellation Email to Customer
          if (customerEmail) {
            await emailService.sendOrderCancelledEmail(customerEmail, {
              customerName,
              orderNumber: order.orderNumber,
              refundAmount: order.payment && order.payment.status === "COMPLETED" ? order.totalAmount.toNumber() : undefined,
              orderLink: `/orders/${order.id}`,
            });
          }

          // 2. Send Cancellation Email to each Vendor in the order
          const vendorEmails = [];
          for (const item of order.items) {
            const vendor = item.vendor;
            if (vendor.businessEmail) {
              const productSnap = item.productSnapshot as any;
              const productName = productSnap?.name || "your product";
              vendorEmails.push(
                emailService.sendVendorOrderCancelledEmail(vendor.businessEmail, {
                  vendorName: vendor.businessName,
                  orderNumber: order.orderNumber,
                  productName,
                  reason: reason || undefined,
                })
              );
            }
          }
          await Promise.allSettled(vendorEmails);

          // 3. Send Cancellation Email to Admins
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN", isActive: true, email: { not: null } },
            select: { email: true },
          });
          const adminEmails = admins
            .map(admin => admin.email)
            .filter((email): email is string => !!email);

          await Promise.allSettled(
            adminEmails.map(email =>
              emailService.sendAdminOrderCancelledEmail(email, {
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount.toNumber(),
                customerName,
                reason: reason || undefined,
                orderLink: `/admin/orders/${order.id}`,
              })
            )
          );
        } else if (status === "DELIVERED" || status === "DELIVERY_CONFIRMED" || status === "COMPLETED") {
          // 1. Send Completion Confirmed Email to Customer
          if (customerEmail) {
            await emailService.sendOrderDeliveryConfirmedEmail(customerEmail, {
              customerName,
              orderNumber: order.orderNumber,
              orderLink: `/orders/${order.id}`,
            });
          }

          // 2. Send Email to each Vendor
          const vendorEmails = [];
          for (const item of order.items) {
            const vendor = item.vendor;
            if (vendor.businessEmail) {
              const productSnap = item.productSnapshot as any;
              const productName = productSnap?.name || "your product";
              vendorEmails.push(
                emailService.sendVendorOrderCompletedEmail(vendor.businessEmail, {
                  vendorName: vendor.businessName,
                  orderNumber: order.orderNumber,
                  productName,
                  amountReleased: item.totalPrice.toNumber(),
                  walletLink: "/vendor/wallet",
                })
              );
            }
          }
          await Promise.allSettled(vendorEmails);

          // 3. Send Email to Admins
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN", isActive: true, email: { not: null } },
            select: { email: true },
          });
          const adminEmails = admins
            .map(admin => admin.email)
            .filter((email): email is string => !!email);

          await Promise.allSettled(
            adminEmails.map(email =>
              emailService.sendAdminOrderCompletedEmail(email, {
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount.toNumber(),
                customerName,
                orderLink: `/admin/orders/${order.id}`,
              })
            )
          );
        }
      } catch (emailError) {
        console.error("[Admin Override Status] Failed to send transactional emails:", emailError);
      }
    })();

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
