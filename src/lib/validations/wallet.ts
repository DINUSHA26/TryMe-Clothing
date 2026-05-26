import { z } from "zod";

/**
 * Sri Lankan banks (top 15 banks)
 */
export const SRI_LANKAN_BANKS = [
  "Bank of Ceylon",
  "People's Bank",
  "Commercial Bank of Ceylon",
  "Hatton National Bank",
  "Sampath Bank",
  "Nations Trust Bank",
  "Seylan Bank",
  "DFCC Bank",
  "Union Bank",
  "Pan Asia Banking Corporation",
  "National Development Bank",
  "Cargills Bank",
  "Standard Chartered Bank",
  "HSBC",
  "Citibank",
] as const;

/**
 * Bank account validation schema
 */
export const bankAccountSchema = z.object({
  bankName: z.enum(SRI_LANKAN_BANKS, {
    message: "Please select a valid Sri Lankan bank",
  }),
  accountNumber: z
    .string()
    .min(8, "Account number must be at least 8 digits")
    .max(20, "Account number must not exceed 20 digits")
    .regex(/^\d+$/, "Account number must contain only digits")
    .trim(),
  accountHolder: z
    .string()
    .min(2, "Account holder name must be at least 2 characters")
    .max(100, "Account holder name must not exceed 100 characters")
    .trim(),
  branchCode: z
    .string()
    .length(3, "Branch code must be exactly 3 digits")
    .regex(/^\d{3}$/, "Branch code must be 3 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Payout request schema (vendor)
 */
export const requestPayoutSchema = bankAccountSchema.extend({
  amount: z
    .number()
    .min(1000, "Minimum payout amount is Rs. 1,000")
    .max(1000000, "Maximum payout amount is Rs. 1,000,000")
    .multipleOf(0.01, "Invalid amount precision"),
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

/**
 * Process payout schema (admin approval)
 */
export const processPayoutSchema = z.object({
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ProcessPayoutInput = z.infer<typeof processPayoutSchema>;

/**
 * Complete payout schema (admin marks as completed)
 */
export const completePayoutSchema = z.object({
  transactionRef: z
    .string()
    .min(5, "Transaction reference must be at least 5 characters")
    .max(100, "Transaction reference must not exceed 100 characters")
    .trim(),
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CompletePayoutInput = z.infer<typeof completePayoutSchema>;

/**
 * Fail payout schema (admin marks as failed)
 */
export const failPayoutSchema = z.object({
  notes: z
    .string()
    .min(5, "Failure reason must be at least 5 characters")
    .max(500, "Failure reason must not exceed 500 characters")
    .trim(),
});

export type FailPayoutInput = z.infer<typeof failPayoutSchema>;

/**
 * Wallet transaction filters schema
 */
export const walletTransactionFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  type: z
    .enum(["HOLD", "COMMISSION", "RELEASE", "REFUND", "PAYOUT", "CREDIT"])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type WalletTransactionFiltersInput = z.infer<
  typeof walletTransactionFiltersSchema
>;

/**
 * Payout filters schema (admin)
 */
export const payoutFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  vendorId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type PayoutFiltersInput = z.infer<typeof payoutFiltersSchema>;

/**
 * Vendor payout filters schema (simpler than admin)
 */
export const vendorPayoutFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});

export type VendorPayoutFiltersInput = z.infer<
  typeof vendorPayoutFiltersSchema
>;
