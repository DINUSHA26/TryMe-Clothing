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
import { emailService } from "@/lib/email";

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

    // Trigger transactional emails asynchronously (non-blocking)
    (async () => {
      try {
        if (!order) return;
        const customerEmail = order.customer.user.email;
        const customerName = `${order.customer.user.firstName || ""} ${order.customer.user.lastName || ""}`.trim() || "Customer";

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
                reason,
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
              reason,
              orderLink: `/admin/orders/${order.id}`,
            })
          )
        );
      } catch (emailError) {
        console.error("[Order Cancel API] Failed to send cancellation transactional emails:", emailError);
      }
    })();

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
