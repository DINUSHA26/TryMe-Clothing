import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { uploadFile } from "@/lib/cloudinary";

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

export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const orderId = formData.get("orderId") as string;
    const slipFile = formData.get("slip") as File | null;

    if (!orderId || !slipFile) {
      return NextResponse.json(
        { success: false, error: "Order ID and slip file are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(slipFile.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, and PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (slipFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { success: false, error: `Order is already ${order.status.toLowerCase().replace("_", " ")}` },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Cloudinary upload
    const arrayBuffer = await slipFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, slipFile.type, "bank-slips");
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to upload bank slip. Please try again." },
        { status: 500 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: "LKR",
          status: "PENDING",
          paymentMethod: "BANK_TRANSFER",
          paymentSlipUrl: uploadResult.url,
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentMethod: "BANK_TRANSFER",
          paymentSlipUrl: uploadResult.url,
        },
      });
    }

    // Update order status to PENDING_VERIFICATION
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PENDING_VERIFICATION",
      },
    });

    // Record status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "PENDING_VERIFICATION",
        note: "Bank transfer slip uploaded by customer. Awaiting admin verification.",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: "PENDING_VERIFICATION",
      },
    });
  } catch (error) {
    console.error("Bank transfer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bank transfer. Please try again." },
      { status: 500 }
    );
  }
}
