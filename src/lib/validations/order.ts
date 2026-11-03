/**
 * Order validation schemas
 * Zod schemas for order management operations
 */

import { z } from "zod";
import { OrderStatus } from "@prisma/client";

/**
 * Cancel order schema
 * Used when customer cancels order within 24h
 */
export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim(),
});

/**
 * Request return schema
 * Used when customer requests return within 24h of delivery confirmation
 */
export const requestReturnSchema = z.object({
  orderItemId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Update order item status schema (vendor)
 * Validates status transition and tracking information
 */
export const updateOrderItemStatusSchema = z.object({
  status: z.enum(
    [
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ] as const,
    {
      message: "Invalid status value",
    }
  ),
  trackingNumber: z
    .string()
    .max(50, "Tracking number must not exceed 50 characters")
    .trim()
    .optional()
    .nullable(),
  trackingUrl: z
    .string()
    .url("Invalid tracking URL")
    .max(200, "Tracking URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  note: z
    .string()
    .max(500, "Note must not exceed 500 characters")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Override order status schema (admin)
 * Allows admin to override order status with reason for audit
 */
export const overrideOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    message: "Invalid order status",
  }),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim(),
});

/**
 * Order filters schema
 * Used for filtering and paginating order lists
 */
export const orderFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  source: z.enum(["all", "tryme", "website", "inquiries"]).optional(),
  search: z.string().max(100).trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  // Admin-only filters
  vendorId: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

/**
 * Type exports for use in API routes
 */
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type RequestReturnInput = z.infer<typeof requestReturnSchema>;
export type UpdateOrderItemStatusInput = z.infer<typeof updateOrderItemStatusSchema>;
export type OverrideOrderStatusInput = z.infer<typeof overrideOrderStatusSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
