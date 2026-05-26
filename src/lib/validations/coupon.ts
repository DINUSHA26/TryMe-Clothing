/**
 * Coupon validation schemas for CRUD operations
 */

import { z } from "zod";
import { CouponType } from "@prisma/client";

/**
 * Schema for creating a new coupon
 */
export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code must contain only uppercase letters, numbers, hyphens, and underscores"
      )
      .transform((val) => val.toUpperCase()),
    type: z.nativeEnum(CouponType, {
      message: "Invalid coupon type",
    }),
    value: z.number().positive("Value must be positive"),
    minOrderAmount: z
      .number()
      .positive("Minimum order amount must be positive")
      .optional()
      .nullable(),
    maxDiscount: z
      .number()
      .positive("Maximum discount must be positive")
      .optional()
      .nullable(),
    usageLimit: z
      .number()
      .int("Usage limit must be an integer")
      .positive("Usage limit must be positive")
      .optional()
      .nullable(),
    perUserLimit: z
      .number()
      .int("Per user limit must be an integer")
      .positive("Per user limit must be positive")
      .default(1),
    vendorId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === CouponType.PERCENTAGE && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage value cannot exceed 100",
        path: ["value"],
      });
    }
  });

/**
 * Schema for updating a coupon
 */
export const updateCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code must contain only uppercase letters, numbers, hyphens, and underscores"
      )
      .transform((val) => val.toUpperCase())
      .optional(),
    type: z
      .nativeEnum(CouponType, {
        message: "Invalid coupon type",
      })
      .optional(),
    value: z.number().positive("Value must be positive").optional(),
    minOrderAmount: z
      .number()
      .positive("Minimum order amount must be positive")
      .optional()
      .nullable(),
    maxDiscount: z
      .number()
      .positive("Maximum discount must be positive")
      .optional()
      .nullable(),
    usageLimit: z
      .number()
      .int("Usage limit must be an integer")
      .positive("Usage limit must be positive")
      .optional()
      .nullable(),
    perUserLimit: z
      .number()
      .int("Per user limit must be an integer")
      .positive("Per user limit must be positive")
      .optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === CouponType.PERCENTAGE &&
      data.value !== undefined &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage value cannot exceed 100",
        path: ["value"],
      });
    }
  });

/**
 * Schema for coupon filters
 */
export const couponFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.nativeEnum(CouponType).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  vendorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Type exports
 */
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CouponFiltersInput = z.infer<typeof couponFiltersSchema>;
