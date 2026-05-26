/**
 * Validation schemas for checkout operations
 */

import { z } from "zod";

/**
 * Validate coupon schema
 */
export const validateCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(50, "Coupon code is too long")
    .toUpperCase()
    .trim(),
  subtotal: z
    .number()
    .min(0, "Subtotal must be non-negative")
    .max(9999999.99, "Subtotal is too large"),
  cartItems: z
    .array(
      z.object({
        productId: z.string().cuid(),
        vendorId: z.string().cuid(),
        quantity: z.number().int().min(1),
        price: z.number().min(0),
      })
    )
    .min(1, "Cart must have at least one item"),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

/**
 * Create order schema
 */
export const createOrderSchema = z.object({
  shippingAddressId: z.string().cuid("Invalid address ID"),
  couponCode: z
    .string()
    .max(50, "Coupon code is too long")
    .toUpperCase()
    .trim()
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .trim()
    .optional()
    .nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
