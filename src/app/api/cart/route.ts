import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { addToCartSchema } from "@/lib/validations/cart";
import { convertDbCartItems, calculateCartTotals, dbCartItemToCartItem } from "@/lib/utils/cart";

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
 * GET /api/cart
 * Fetch customer's cart with all items
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { customerId },
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

    // If cart doesn't exist, create one
    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
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
    }

    // Fetch variant data separately for items with variants
    const itemsWithVariants = await Promise.all(
      cart.items.map(async (item) => {
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          return { ...item, variant };
        }
        return { ...item, variant: null };
      })
    );

    // Convert to client format
    const cartItems = convertDbCartItems(itemsWithVariants as any);
    const { itemCount, subtotal } = calculateCartTotals(cartItems);

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          items: cartItems,
        },
        itemCount,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Add item to cart (or update quantity if exists)
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

    const body = await request.json();
    const validation = addToCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId, quantity, variantId } = validation.data;

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (
      !product ||
      !product.isActive ||
      product.isDisabledByAdmin ||
      product.vendor.status !== "ACTIVE" ||
      !product.vendor.user.isActive
    ) {
      return NextResponse.json(
        { success: false, error: "Product not available" },
        { status: 404 }
      );
    }

    // If variant specified, validate it
    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json(
          { success: false, error: "Invalid variant" },
          { status: 400 }
        );
      }
    }

    // Check stock availability
    const availableStock = variant ? variant.stock : product.stock;

    if (availableStock === 0) {
      return NextResponse.json(
        { success: false, error: "Product is out of stock" },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > availableStock) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${availableStock} available. You already have ${existingItem.quantity} in your cart.`,
          },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
      });
    } else {
      // Create new item
      if (quantity > availableStock) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${availableStock} available`,
          },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          variantId: variantId || null,
        },
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
      });
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
          const v = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          return { ...item, variant: v };
        }
        return { ...item, variant: null };
      })
    );

    const cartItems = convertDbCartItems(itemsWithVariants as any);
    const { itemCount, subtotal } = calculateCartTotals(cartItems);

    // Get the newly created/updated item in client format
    const dbItemForConversion = {
      ...cartItem,
      variant: variant || null
    };
    const addedItemFormatted = dbCartItemToCartItem(dbItemForConversion as any);

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: updatedCart!.id,
          items: cartItems,
        },
        addedItem: addedItemFormatted,
        itemCount,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}
