/**
 * Order creation API
 * POST /api/orders/create - Create order from cart
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";
import { createOrderSchema } from "@/lib/validations/checkout";
import {
  generateOrderNumber,
  calculateDiscount,
  createProductSnapshot,
  createVariantSnapshot,
  calculateItemPrice,
  validateStockAvailability,
} from "@/lib/utils/order";
import { createAddressSnapshot } from "@/lib/utils/address";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return null;
  }

  let customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    try {
      customer = await prisma.customer.create({
        data: { userId },
      });
    } catch (e) {
      console.error("Failed to auto-create customer record for order creation:", e);
      return null;
    }
  }

  return customer.id;
}

/**
 * POST /api/orders/create
 * Create order from cart with PENDING_PAYMENT status
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
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { shippingAddressId, couponCode, notes } = validation.data;

    // Verify shipping address belongs to customer
    const shippingAddress = await prisma.shippingAddress.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress || shippingAddress.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Get cart with all items
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
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Fetch variants
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
      return NextResponse.json(
        { success: false, error: stockValidation.errors[0] },
        { status: 400 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    itemsWithVariants.forEach((item) => {
      const itemPrice = calculateItemPrice(
        item.product.price,
        item.variant?.priceAdjustment
      );
      subtotal += itemPrice * item.quantity;
    });

    // Validate and apply coupon if provided
    let coupon: any = null;
    let discountAmount = 0;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { success: false, error: "Invalid coupon code" },
          { status: 400 }
        );
      }

      // Validate coupon (date, usage, etc.)
      const now = new Date();
      if (
        now < coupon.validFrom ||
        (coupon.validUntil && now > coupon.validUntil)
      ) {
        return NextResponse.json(
          { success: false, error: "Coupon is not valid at this time" },
          { status: 400 }
        );
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json(
          { success: false, error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }

      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, customerId },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return NextResponse.json(
          { success: false, error: "You have already used this coupon" },
          { status: 400 }
        );
      }

      // Calculate eligible subtotal for coupon
      let couponSubtotal = subtotal;
      if (coupon.vendorId) {
        const vendorItems = itemsWithVariants.filter(
          (item) => item.product.vendorId === coupon.vendorId
        );

        if (vendorItems.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "This coupon is only valid for specific vendor products",
            },
            { status: 400 }
          );
        }

        let tempVendorSubtotal = 0;
        vendorItems.forEach((item) => {
          const itemPrice = calculateItemPrice(
            item.product.price,
            item.variant?.priceAdjustment
          );
          tempVendorSubtotal += itemPrice * item.quantity;
        });
        couponSubtotal = Number(tempVendorSubtotal.toFixed(2));
      }

      if (
        coupon.minOrderAmount &&
        couponSubtotal < coupon.minOrderAmount.toNumber()
      ) {
        const errorMsg = coupon.vendorId
          ? `Minimum order amount for this vendor's products is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`
          : `Minimum order amount is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`;
        return NextResponse.json(
          {
            success: false,
            error: errorMsg,
          },
          { status: 400 }
        );
      }

      // Calculate discount
      discountAmount = calculateDiscount(
        couponSubtotal,
        coupon.type,
        coupon.value,
        coupon.maxDiscount
      );
    }

    // Calculate totals
    const shippingAmount = 0; // Will be implemented in Phase 9
    const totalAmount = subtotal - discountAmount + shippingAmount;

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = await generateOrderNumber(tx);

      // Create address snapshot
      const addressSnapshot = createAddressSnapshot(shippingAddress as any);

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "PENDING_PAYMENT",
          subtotal: new Prisma.Decimal(subtotal),
          discountAmount: new Prisma.Decimal(discountAmount),
          shippingAmount: new Prisma.Decimal(shippingAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          shippingAddressJson: addressSnapshot as any,
          couponId: coupon?.id || null,
          notes: notes || null,
        },
      });

      // Create order items and decrement stock
      for (const cartItem of itemsWithVariants) {
        const product = cartItem.product;
        const variant = cartItem.variant;

        const productSnapshot = createProductSnapshot(product);
        const variantSnapshot = createVariantSnapshot(variant);
        const unitPrice = calculateItemPrice(
          product.price,
          variant?.priceAdjustment
        );
        const totalPrice = unitPrice * cartItem.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            vendorId: product.vendor.id,
            productSnapshot: productSnapshot as any,
            quantity: cartItem.quantity,
            unitPrice: new Prisma.Decimal(unitPrice),
            totalPrice: new Prisma.Decimal(totalPrice),
            variantId: variant?.id || null,
            variantSnapshot: variantSnapshot as any,
            status: "PENDING_PAYMENT",
          },
        });

        // Decrement stock
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stock: { decrement: cartItem.quantity },
            },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: { decrement: cartItem.quantity },
            },
          });
        }
      }

      // Create coupon usage if coupon applied
      if (coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            customerId,
            orderId: order.id,
          },
        });

        // Increment coupon usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Create order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PENDING_PAYMENT",
          note: "Order created",
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.toNumber(),
        itemCount: itemsWithVariants.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
