import { z } from 'zod';
import {
  DisputeReason,
  DisputeStatus,
  ResolutionType,
  MAX_DISPUTE_EVIDENCE_IMAGES,
  MAX_DISPUTE_COMMENT_LENGTH,
} from '@/types/dispute';

// Create dispute schema
export const createDisputeSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  orderItemId: z.string().optional(),
  reason: z.nativeEnum(DisputeReason, {
    message: 'Invalid dispute reason',
  }),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  evidence: z
    .array(z.string().url('Invalid image URL'))
    .max(MAX_DISPUTE_EVIDENCE_IMAGES, `Maximum ${MAX_DISPUTE_EVIDENCE_IMAGES} images allowed`)
    .optional()
    .default([]),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

// Add comment schema
export const addDisputeCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(MAX_DISPUTE_COMMENT_LENGTH, `Comment must not exceed ${MAX_DISPUTE_COMMENT_LENGTH} characters`)
    .trim(),
  isInternal: z.boolean().optional().default(false),
});

export type AddDisputeCommentInput = z.infer<typeof addDisputeCommentSchema>;

// Resolve dispute schema
export const resolveDisputeSchema = z.object({
  resolutionType: z.nativeEnum(ResolutionType, {
    message: 'Invalid resolution type',
  }),
  adminNotes: z
    .string()
    .min(10, 'Admin notes must be at least 10 characters')
    .max(1000, 'Admin notes must not exceed 1000 characters')
    .trim(),
  refundAmount: z
    .number()
    .positive('Refund amount must be positive')
    .optional()
    .refine(
      (val) => {
        if (val === undefined) return true;
        // Check if refund amount has max 2 decimal places
        return /^\d+(\.\d{1,2})?$/.test(val.toString());
      },
      { message: 'Refund amount must have at most 2 decimal places' }
    ),
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

// Dispute filters schema
export const disputeFiltersSchema = z.object({
  status: z
    .union([
      z.nativeEnum(DisputeStatus),
      z.array(z.nativeEnum(DisputeStatus)),
    ])
    .optional(),
  reason: z
    .union([
      z.nativeEnum(DisputeReason),
      z.array(z.nativeEnum(DisputeReason)),
    ])
    .optional(),
  customerId: z.string().cuid('Invalid customer ID').optional(),
  orderId: z.string().cuid('Invalid order ID').optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DisputeFiltersInput = z.infer<typeof disputeFiltersSchema>;

// Update dispute status schema (admin only)
export const updateDisputeStatusSchema = z.object({
  status: z.nativeEnum(DisputeStatus, {
    message: 'Invalid dispute status',
  }),
  notes: z.string().min(1, 'Notes are required when updating status').trim(),
});

export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>;

// Evidence upload validation
export const evidenceUploadSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        publicId: z.string().min(1, 'Public ID is required'),
      })
    )
    .max(MAX_DISPUTE_EVIDENCE_IMAGES, `Maximum ${MAX_DISPUTE_EVIDENCE_IMAGES} images allowed`),
});

export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>;

// Validation helper: Check if date range is valid
export function validateDateRange(dateFrom?: Date, dateTo?: Date): boolean {
  if (!dateFrom || !dateTo) return true;
  return dateFrom <= dateTo;
}

// Validation helper: Validate refund amount against order total
export function validateRefundAmount(
  refundAmount: number,
  orderTotal: number
): { valid: boolean; error?: string } {
  if (refundAmount <= 0) {
    return { valid: false, error: 'Refund amount must be positive' };
  }

  if (refundAmount > orderTotal) {
    return {
      valid: false,
      error: `Refund amount cannot exceed order total (Rs. ${orderTotal.toFixed(2)})`,
    };
  }

  return { valid: true };
}
