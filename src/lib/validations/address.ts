/**
 * Validation schemas for address management
 */

import { z } from "zod";

// Sri Lankan phone number regex (071, 072, 075, 076, 077, 078, 070)
const SL_PHONE_REGEX = /^(?:\+94|0)7[01245678]\d{7}$/;

// Sri Lankan postal code (5 digits)
const SL_POSTAL_CODE_REGEX = /^\d{5}$/;

// Province enum
const PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;

/**
 * Create address schema
 */
export const createAddressSchema = z.object({
  label: z
    .string()
    .min(2, "Label must be at least 2 characters")
    .max(50, "Label must not exceed 50 characters")
    .trim(),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),
  phone: z
    .string()
    .regex(
      SL_PHONE_REGEX,
      "Invalid Sri Lankan phone number (e.g., 0771234567)"
    )
    .trim(),
  addressLine1: z
    .string()
    .min(5, "Address line 1 must be at least 5 characters")
    .max(200, "Address line 1 must not exceed 200 characters")
    .trim(),
  addressLine2: z
    .string()
    .max(200, "Address line 2 must not exceed 200 characters")
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim(),
  province: z.enum(PROVINCES, {
    message: "Please select a valid province",
  }),
  postalCode: z
    .string()
    .regex(SL_POSTAL_CODE_REGEX, "Invalid postal code (5 digits required)")
    .trim(),
  isDefault: z.boolean().default(false),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

/**
 * Update address schema (all fields optional except id)
 */
export const updateAddressSchema = createAddressSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
