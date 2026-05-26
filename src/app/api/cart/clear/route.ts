import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Helper function to require customer authentication
 */
/**
 * Helper function to require customer authentication — allow any authenticated user
 * to have a cart (Vendor/Admin should be able to buy too)
 */
async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId) {
    return null;
  }

  // Find or create customer record for this user
  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    // We only create customers for logged in users who try to use customer features
    try {
      customer = await prisma.customer.create({
        data: { userId },
      });
    } catch (e) {
      console.error("Failed to create customer record:", e);
      return null;
    }
  }

  return customer.id;
}

/**
 * DELETE /api/cart/clear
 * Clear all items from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer's cart
    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      // No cart exists, return empty cart response
      return NextResponse.json({
        success: true,
        data: {
          cart: {
            items: [],
          },
          itemCount: 0,
          subtotal: 0,
        },
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          items: [],
        },
        itemCount: 0,
        subtotal: 0,
      },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
