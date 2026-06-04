/**
 * Complete Order API
 * POST /api/orders/[orderId]/complete
 *
 * Customer manually marks their order as completed.
 * Sets order status and eligible item statuses to COMPLETED.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { manualCompleteOrder } from "@/lib/utils/orderCompletion";
import { emailService } from "@/lib/email";

async function getAuthenticatedCustomer(request: NextRequest): Promise<{ customerId: string; userId: string } | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || userRole !== UserRole.CUSTOMER) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) return null;

  return { customerId: customer.id, userId };
}

/**
 * POST /api/orders/[orderId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuthenticatedCustomer(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Verify order exists and belongs to this customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.customerId !== auth.customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Verify order status
    if (!["DELIVERED", "DELIVERY_CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "Only delivered orders can be completed" },
        { status: 400 }
      );
    }

    const result = await manualCompleteOrder(orderId, auth.userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to complete order" },
        { status: 400 }
      );
    }

    // Trigger transactional emails asynchronously (non-blocking)
    (async () => {
      try {
        if (!order) return;
        const customerEmail = order.customer.user.email;
        const customerName = `${order.customer.user.firstName || ""} ${order.customer.user.lastName || ""}`.trim() || "Customer";

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
      } catch (emailError) {
        console.error("[complete/route.ts] Failed to send completion transactional emails:", emailError);
      }
    })();

    // Re-fetch updated order for response
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder!.id,
          orderNumber: updatedOrder!.orderNumber,
          status: updatedOrder!.status,
        },
      },
    });
  } catch (error) {
    console.error("[Order Complete] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to complete order",
      },
      { status: 500 }
    );
  }
}
