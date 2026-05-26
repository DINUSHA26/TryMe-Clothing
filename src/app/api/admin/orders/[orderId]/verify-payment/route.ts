import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { calculateVendorEarnings, creditVendorWallets } from "@/lib/utils/wallet";
import { createChatRoomsForOrder } from "@/lib/chat/roomManager";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const adminUser = requireAdmin(request);
    const adminUserId = adminUser.userId;

    const { orderId } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: "APPROVE" or "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        customer: {
          include: {
            user: { select: { id: true } },
          },
        },
        coupon: {
          select: {
            vendorId: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                commissionRate: true,
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

    if (order.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { success: false, error: "Order is not pending verification" },
        { status: 400 }
      );
    }

    const newOrderStatus = action === "APPROVE" ? "PAYMENT_CONFIRMED" : "PENDING_PAYMENT";
    const paymentStatus = action === "APPROVE" ? "COMPLETED" : "FAILED";

    await prisma.$transaction(
      async (tx) => {
        // 1. Update Payment record
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: paymentStatus,
              paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
            },
          });
        }

        // 2. Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { status: newOrderStatus },
        });

        // 3. Create status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: newOrderStatus,
            note: `Admin ${action === "APPROVE" ? "approved" : "rejected"} bank transfer. ${reason || ""}`,
            createdBy: adminUserId,
          },
        });

        // 4. Update order items
        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { status: newOrderStatus },
        });

        // 5. If approved, credit vendor wallets
        if (action === "APPROVE") {
          const vendorEarnings = calculateVendorEarnings(
            order.items,
            order.discountAmount,
            order.coupon?.vendorId
          );
          await creditVendorWallets(vendorEarnings, order.id, order.orderNumber, tx);
        }
      },
      { timeout: 30000 }
    );

    // Post-transaction side effects
    if (action === "APPROVE") {
      try {
        await createChatRoomsForOrder(order.id);
      } catch (chatError) {
        console.error("Failed to create chat rooms:", chatError);
      }

      try {
        await createNotification({
          userId: order.customer.user.id,
          type: NotificationType.ORDER_PAYMENT_CONFIRMED,
          title: "Payment Verified",
          message: `Your bank transfer for order ${order.orderNumber} has been verified successfully.`,
          link: `/orders/${order.id}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount.toNumber(),
          },
        });
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
      }
    } else {
      // Send rejection notification
      try {
        await createNotification({
          userId: order.customer.user.id,
          type: NotificationType.ORDER_STATUS_OVERRIDE, // Reuse this
          title: "Payment Verification Failed",
          message: `Your bank transfer for order ${order.orderNumber} was rejected. ${reason ? `Reason: ${reason}` : "Please submit a valid slip or use an online payment method."}`,
          link: `/orders/${order.id}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        });
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
      }
    }

    return NextResponse.json({ success: true, data: { status: newOrderStatus } });
  } catch (error) {
    console.error("Admin verify payment error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
