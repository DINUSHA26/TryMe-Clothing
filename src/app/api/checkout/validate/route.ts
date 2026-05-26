/**
 * Checkout validation API
 * POST /api/checkout/validate - Pre-checkout validation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { validateStockAvailability } from "@/lib/utils/order";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return null;
  }

  // Find or create customer record for this user
  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
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
 * POST /api/checkout/validate
 * Validate cart and address before checkout
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

    const errors: any[] = [];
    const warnings: any[] = [];

    // Get cart items
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  include: {
                    user: true,
                  },
                },
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      errors.push({
        type: "cart",
        message: "Your cart is empty",
      });
    } else {
      // Fetch variants for items that have them
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

      // Validate stock
      const stockValidation = validateStockAvailability(itemsWithVariants);
      if (!stockValidation.isValid) {
        stockValidation.errors.forEach((error) => {
          errors.push({
            type: "stock",
            message: error,
          });
        });
      }

      // Check for low stock warnings
      itemsWithVariants.forEach((item) => {
        const stock = item.variant ? item.variant.stock : item.product.stock;
        if (stock > 0 && stock <= 5 && item.quantity <= stock) {
          warnings.push({
            type: "low_stock",
            message: `${item.product.name}: Low stock (${stock} remaining)`,
            productId: item.productId,
          });
        }
      });
    }

    // Check if customer has at least one address
    const addressCount = await prisma.shippingAddress.count({
      where: { customerId },
    });

    if (addressCount === 0) {
      errors.push({
        type: "address",
        message: "Please add a shipping address",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings,
      },
    });
  } catch (error) {
    console.error("Error validating checkout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate checkout" },
      { status: 500 }
    );
  }
}
