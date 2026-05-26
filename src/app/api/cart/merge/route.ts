import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { mergeCartSchema } from "@/lib/validations/cart";
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
 * POST /api/cart/merge
 * Merge guest cart items into customer cart after login
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
    const validation = mergeCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: (validation.error as any).errors[0].message },
        { status: 400 }
      );
    }

    const { guestCartItems } = validation.data;

    // If no items to merge, just return current cart
    if (!guestCartItems || guestCartItems.length === 0) {
      const cart = await prisma.cart.findUnique({
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

      const itemsWithVariants = cart
        ? await Promise.all(
          cart.items.map(async (item) => {
            if (item.variantId) {
              const variant = await prisma.productVariant.findUnique({
                where: { id: item.variantId },
              });
              return { ...item, variant };
            }
            return { ...item, variant: null };
          })
        )
        : [];

      const cartItems = convertDbCartItems(itemsWithVariants as any);
      const { itemCount, subtotal } = calculateCartTotals(cartItems);

      return NextResponse.json({
        success: true,
        data: {
          cart: {
            id: cart?.id || "",
            items: itemsWithVariants,
          },
          merged: {
            itemsAdded: 0,
            itemsUpdated: 0,
            itemsSkipped: 0,
          },
          itemCount,
          subtotal,
        },
      });
    }

    // Use transaction for merge operation
    const result = await prisma.$transaction(async (tx) => {
      const stats = { itemsAdded: 0, itemsUpdated: 0, itemsSkipped: 0 };

      // Get or create cart
      let cart = await tx.cart.findUnique({
        where: { customerId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { customerId },
        });
      }

      // Get existing cart items
      const existingItems = await tx.cartItem.findMany({
        where: { cartId: cart.id },
      });

      // Process each guest cart item
      for (const guestItem of guestCartItems) {
        // Validate product
        const product = await tx.product.findUnique({
          where: { id: guestItem.productId },
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
          stats.itemsSkipped++;
          continue;
        }

        // Validate variant if specified
        let variant = null;
        if (guestItem.variantId) {
          variant = await tx.productVariant.findUnique({
            where: { id: guestItem.variantId },
          });

          if (!variant || variant.productId !== product.id) {
            stats.itemsSkipped++;
            continue;
          }
        }

        // Check available stock
        const availableStock = variant ? variant.stock : product.stock;

        if (availableStock === 0) {
          stats.itemsSkipped++;
          continue;
        }

        // Check if item already exists in DB cart
        const existingItem = existingItems.find(
          (item) =>
            item.productId === guestItem.productId &&
            item.variantId === (guestItem.variantId || null)
        );

        if (existingItem) {
          // Combine quantities (capped by stock)
          const newQuantity = Math.min(
            existingItem.quantity + guestItem.quantity,
            availableStock
          );

          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });

          stats.itemsUpdated++;
        } else {
          // Add new item (capped by stock)
          const quantity = Math.min(guestItem.quantity, availableStock);

          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: guestItem.productId,
              quantity,
              variantId: guestItem.variantId || null,
            },
          });

          stats.itemsAdded++;
        }
      }

      return { cartId: cart.id, stats };
    });

    // Fetch merged cart
    const mergedCart = await prisma.cart.findUnique({
      where: { id: result.cartId },
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
      mergedCart!.items.map(async (item) => {
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
          id: mergedCart!.id,
          items: itemsWithVariants,
        },
        merged: result.stats,
        itemCount,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Error merging cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to merge cart" },
      { status: 500 }
    );
  }
}
