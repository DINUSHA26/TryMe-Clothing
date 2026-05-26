/**
 * Request return API
 * POST /api/orders/[orderId]/request-return - Customer requests return (within 24h of delivery confirmation)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { requestReturnSchema } from "@/lib/validations/order";
import { validateStatusTransition } from "@/lib/utils/order";
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
 * POST /api/orders/[orderId]/request-return
 * Request return within 24 hours of delivery confirmation
 * Return processing (approval/refund) will be handled by Admin in Phase 14 (Dispute System)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = requestReturnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reason, description, orderItemId, quantity } = validation.data;

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer: true,
        items: true,
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

    // If orderItemId is provided, validate specific item
    let targetItem = null;
    if (orderItemId) {
      targetItem = order.items.find(item => item.id === orderItemId);
      if (!targetItem) {
        return NextResponse.json(
          { success: false, error: "Item not found in this order" },
          { status: 404 }
        );
      }

      // Check if item is already returned or disputed
      if (targetItem.status === "RETURN_REQUESTED" || targetItem.status === "RETURNED") {
        return NextResponse.json(
          { success: false, error: "Return already requested for this item" },
          { status: 400 }
        );
      }
    }

    // Validate status transition
    const currentStatusToValidate = targetItem ? targetItem.status : order.status;
    const transitionValidation = validateStatusTransition(
      currentStatusToValidate,
      "RETURN_REQUESTED",
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

    // Request return in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      if (orderItemId) {
        // 1. Update individual item status (using raw SQL to bypass out-of-sync Prisma client runtime)
        await tx.$executeRawUnsafe(
          `UPDATE "OrderItem" SET "status" = 'RETURN_REQUESTED', "refundStatus" = 'PENDING' WHERE "id" = $1`,
          orderItemId
        );

        // 2. Check if all items are now in a return/dispute state to update order status
        const allItems = await tx.orderItem.findMany({
          where: { orderId },
        });
        
        const allReturned = allItems.every(item => 
          ["RETURN_REQUESTED", "RETURNED", "DISPUTED", "CANCELLED"].includes(item.status)
        );

        if (allReturned) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "RETURN_REQUESTED" },
          });
        }
      } else {
        // Legacy: Update all items and the order
        await tx.$executeRawUnsafe(
          `UPDATE "OrderItem" SET "status" = 'RETURN_REQUESTED', "refundStatus" = 'PENDING' WHERE "orderId" = $1`,
          orderId
        );

        await tx.order.update({
          where: { id: orderId },
          data: { status: "RETURN_REQUESTED" },
        });
      }

      // 3. Create status history with return reason
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "RETURN_REQUESTED",
          note: `Return requested by customer for ${targetItem ? targetItem.id : 'entire order'}: ${reason}${
            description ? `\n${description}` : ""
          }`,
          createdBy: null, // Customer action
        },
      });

      // Return the updated order
      return await tx.order.findUnique({
        where: { id: orderId },
      });
    });

    console.log(`[Order] Return requested for order ${order.orderNumber}:`, {
      orderId,
      customerId,
      reason,
    });

    // Send notification to customer
    try {
      await createNotification({
        userId: order.customer.userId,
        type: NotificationType.ORDER_RETURN_REQUESTED,
        title: "Return Request Submitted",
        message: `Your return request for order ${order.orderNumber} has been submitted. An admin will review it shortly.`,
        link: `/orders/${orderId}`,
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
        },
      });
    } catch (notifError) {
      console.error("[Order Request Return] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: result?.status || "RETURN_REQUESTED",
        },
        message:
          "Return request submitted. An admin will review your request shortly.",
      },
    });
  } catch (error) {
    console.error("[Order Request Return] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to request return",
      },
      { status: 500 }
    );
  }
}
