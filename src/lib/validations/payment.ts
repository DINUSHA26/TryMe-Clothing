/**
 * Payment validation schemas
 * Zod schemas for validating payment-related requests
 */

import { z } from "zod";

/**
 * Payment initiation request validation
 */
export const initiatePaymentSchema = z.object({
  orderId: z.string().cuid("Invalid order ID format"),
});

/**
 * PayHere webhook notification validation
 * Validates the payload sent by PayHere after payment
 */
export const payhereWebhookSchema = z.object({
  merchant_id: z.string().min(1, "Merchant ID is required"),
  order_id: z.string().min(1, "Order ID is required"),
  payhere_amount: z.string().min(1, "Amount is required"),
  payhere_currency: z.string().min(1, "Currency is required"),
  status_code: z.string().min(1, "Status code is required"),
  md5sig: z.string().min(1, "Signature is required"),
  payment_id: z.string().min(1, "Payment ID is required"),
  payhere_reference: z.string().optional(),
  card_holder_name: z.string().optional(),
  card_no: z.string().optional(),
  card_expiry: z.string().optional(),
  method: z.string().optional(),
  status_message: z.string().optional(),
  custom_1: z.string().optional(),
  custom_2: z.string().optional(),
});

/**
 * Payment query validation
 */
export const paymentQuerySchema = z.object({
  paymentId: z.string().cuid("Invalid payment ID format"),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type PayHereWebhookInput = z.infer<typeof payhereWebhookSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
