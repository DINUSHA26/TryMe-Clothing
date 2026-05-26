import { z } from "zod";

/**
 * Validation schema for adding item to cart
 */
export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999"),
  variantId: z.string().cuid("Invalid variant ID").optional().nullable(),
});

/**
 * Validation schema for updating cart item quantity
 */
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative")
    .max(999, "Quantity cannot exceed 999"),
});

/**
 * Validation schema for merging guest cart
 */
export const mergeCartSchema = z.object({
  guestCartItems: z
    .array(
      z.object({
        productId: z.string().cuid("Invalid product ID"),
        quantity: z.number().int().min(1).max(999),
        variantId: z.string().cuid().optional().nullable(),
      })
    )
    .max(50, "Too many items to merge (maximum 50)"),
});

/**
 * Export inferred types
 */
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
