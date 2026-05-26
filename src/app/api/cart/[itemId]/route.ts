import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { convertDbCartItems, calculateCartTotals } from "@/lib/utils/cart";

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
 * PUT /api/cart/[itemId]
 * Update cart item quantity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // Find cart item and verify it belongs to customer
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateCartItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: (validation.error as any).errors[0].message },
        { status: 400 }
      );
    }

    const { quantity } = validation.data;

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Validate stock availability
      let availableStock = cartItem.product.stock;

      if (cartItem.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: cartItem.variantId },
        });

        if (!variant) {
          return NextResponse.json(
            { success: false, error: "Variant not found" },
            { status: 404 }
          );
        }

        availableStock = variant.stock;
      }

      if (quantity > availableStock) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${availableStock} available`,
          },
          { status: 400 }
        );
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Fetch variant data separately
    const itemsWithVariants = await Promise.all(
      updatedCart!.items.map(async (item) => {
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          return { ...item, variant };
        }
        return { ...item, variant: null };
      })
    );

    const cartItems = convertDbCartItems(itemsWithVariants as any);
    const { itemCount, subtotal } = calculateCartTotals(cartItems);

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: updatedCart!.id,
          items: cartItems,
        },
        itemCount,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[itemId]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // Find cart item and verify it belongs to customer
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Fetch variant data separately
    const itemsWithVariants = await Promise.all(
      updatedCart!.items.map(async (item) => {
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          return { ...item, variant };
        }
        return { ...item, variant: null };
      })
    );

    const cartItems = convertDbCartItems(itemsWithVariants as any);
    const { itemCount, subtotal } = calculateCartTotals(cartItems);

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: updatedCart!.id,
          items: cartItems,
        },
        itemCount,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete cart item" },
      { status: 500 }
    );
  }
}
