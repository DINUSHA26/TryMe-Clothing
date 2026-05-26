/**
 * Report Validation Schemas
 * Zod schemas for report filters and export requests
 */

import { z } from "zod";

/**
 * Base report filters schema
 */
export const reportFiltersSchema = z.object({
  // Date range
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),

  // Pagination
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),

  // Time period for trends
  period: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),

  // Sorting
  sortBy: z.enum(["revenue", "units", "date", "count", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

  // Filters
  vendorId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),

  // Limit for top N queries
  limit: z.coerce.number().int().positive().max(50).default(10),

  // Amount range
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

/**
 * Admin overview report filters
 */
export const adminOverviewFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendorId: z.string().optional(),
});

/**
 * Revenue trends report filters
 */
export const revenueTrendsFiltersSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendorId: z.string().optional(),
});

/**
 * Order distribution filters
 */
export const orderDistributionFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendorId: z.string().optional(),
});

/**
 * Top vendors/products filters
 */
export const topItemsFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(["revenue", "units", "count"]).optional().default("revenue"),
});

/**
 * Export request schema
 */
export const exportRequestSchema = z.object({
  reportType: z.enum(["sales", "vendors", "commission", "products", "orders"]),
  filters: z.any().optional().default({}),
  format: z.enum(["csv"]).default("csv"),
});

/**
 * Vendor report filters schema
 */
export const vendorReportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  period: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(["revenue", "units"]).optional().default("revenue"),
});

/**
 * Date range validation helper
 */
export function validateDateRangeSchema(dateFrom?: string, dateTo?: string): void {
  if (dateFrom && isNaN(new Date(dateFrom).getTime())) {
    throw new Error("Invalid start date format");
  }

  if (dateTo && isNaN(new Date(dateTo).getTime())) {
    throw new Error("Invalid end date format");
  }

  if (dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (from > to) {
      throw new Error("Start date must be before end date");
    }

    // Maximum 2 years range
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 730) {
      throw new Error("Date range cannot exceed 2 years");
    }
  }
}

// Export types
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type AdminOverviewFilters = z.infer<typeof adminOverviewFiltersSchema>;
export type RevenueTrendsFilters = z.infer<typeof revenueTrendsFiltersSchema>;
export type OrderDistributionFilters = z.infer<typeof orderDistributionFiltersSchema>;
export type TopItemsFilters = z.infer<typeof topItemsFiltersSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type VendorReportFilters = z.infer<typeof vendorReportFiltersSchema>;
