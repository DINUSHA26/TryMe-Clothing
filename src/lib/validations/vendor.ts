import { z } from "zod";

// Sri Lankan phone number regex (071, 072, 075, 076, 077, 078, 070)
const SL_PHONE_REGEX = /^(?:\+94|0)7[01245678]\d{7}$/;

// Create vendor schema
export const createVendorSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters")
    .trim(),
  businessEmail: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  businessPhone: z
    .string()
    .regex(SL_PHONE_REGEX, "Invalid Sri Lankan phone number (e.g., 0771234567)")
    .trim(),
  businessAddress: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  commissionRate: z
    .number()
    .min(0, "Commission rate must be at least 0%")
    .max(100, "Commission rate must not exceed 100%")
    .optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

// Update vendor schema
export const updateVendorSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters")
    .trim()
    .optional(),
  businessEmail: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim()
    .optional(),
  businessPhone: z
    .string()
    .regex(SL_PHONE_REGEX, "Invalid Sri Lankan phone number")
    .trim()
    .optional(),
  businessAddress: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  commissionRate: z
    .number()
    .min(0, "Commission rate must be at least 0%")
    .max(100, "Commission rate must not exceed 100%")
    .optional(),
  isShopOpen: z.boolean().optional(),
  shopClosedReason: z.string().max(500).optional(),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// List vendors query schema
export const vendorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  isShopOpen: z.enum(["true", "false"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]).optional(),
  sortBy: z.enum(["createdAt", "businessName", "commissionRate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type VendorListQuery = z.infer<typeof vendorListQuerySchema>;
