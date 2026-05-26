/**
 * Payment initiation API
 * POST /api/payments/initiate - Create Payment record and generate PayHere hash
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { initiatePaymentSchema } from "@/lib/validations/payment";
import {
  generatePaymentHash,
  buildPaymentRequest,
  getPayHereURL,
  formatAmount,
} from "@/lib/payhere";

/**
 * Helper to get authenticated customer
 */
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
 * POST /api/payments/initiate
 * Create Payment record and generate PayHere redirect data
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = initiatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    // Fetch order with customer, items, and vendor info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { email: true },
            },
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

    // Validate order exists
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate order belongs to customer
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Validate order status is PENDING_PAYMENT
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        {
          success: false,
          error: `Order is already ${order.status.toLowerCase().replace("_", " ")}`,
        },
        { status: 400 }
      );
    }

    // Validate customer email exists
    if (!order.customer.user.email) {
      return NextResponse.json(
        { success: false, error: "Customer email not found" },
        { status: 400 }
      );
    }

    // Check if payment already exists (idempotency)
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    let payment = existingPayment;

    // If payment doesn't exist, create it
    if (!existingPayment) {
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: "LKR",
          status: "PENDING",
        },
      });
    }

    // Get PayHere credentials
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      console.error("PayHere credentials not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Generate PayHere hash
    const hash = generatePaymentHash(
      merchantId,
      order.orderNumber,
      formatAmount(order.totalAmount.toNumber()),
      "LKR",
      merchantSecret
    );

    // Build payment request data
    const paymentData = buildPaymentRequest(order as any, payment!, hash);

    // Get PayHere URL (sandbox or live)
    const payhereUrl = getPayHereURL();

    // Return payment data for client-side form submission
    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment!.id,
        payhereUrl,
        paymentData,
      },
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate payment. Please try again.",
      },
      { status: 500 }
    );
  }
}
