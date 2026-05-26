import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const createReviewSchema = z.object({
  orderItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

/**
 * GET /api/reviews?orderItemId=...
 * Check if a customer has already reviewed a specific order item
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderItemId = searchParams.get("orderItemId");

    if (!orderItemId) {
      return NextResponse.json({ success: false, error: "Missing orderItemId" }, { status: 400 });
    }

    const review = await prisma.productReview.findUnique({
      where: { orderItemId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { review },
    });
  } catch (error: any) {
    console.error("[Reviews GET] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Submit or update a product review
 * Transitions the OrderItem and potentially the entire Order to COMPLETED
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    const userRole = request.headers.get("X-User-Role");

    if (!userId || userRole !== "CUSTOMER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer record
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderItemId, rating, comment } = validation.data;

    // Fetch the order item with order context
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { success: false, error: "Order item not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (orderItem.order.customerId !== customer.id) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to review this item" },
        { status: 403 }
      );
    }

    // Review window check: Must be delivered or confirmed
    const allowedStatuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERY_CONFIRMED,
      OrderStatus.COMPLETED,
      OrderStatus.RETURN_REQUESTED,
      OrderStatus.RETURNED,
      OrderStatus.DISPUTED,
      OrderStatus.REFUNDED
    ];

    if (!allowedStatuses.includes(orderItem.order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Reviews can only be submitted after delivery. Current status: ${orderItem.order.status}`,
        },
        { status: 400 }
      );
    }

    // Atomic transaction for review submission
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert the review
      const review = await tx.productReview.upsert({
        where: { orderItemId },
        create: {
          productId: orderItem.productId,
          customerId: customer.id,
          orderItemId,
          rating,
          comment: comment || null,
        },
        update: {
          rating,
          comment: comment || null,
        },
      });

      return review;
    });

    return NextResponse.json({
      success: true,
      data: { review: result },
    });
  } catch (error: any) {
    console.error("[Reviews POST] Fatal error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to submit review",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

