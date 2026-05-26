/**
 * Payment type definitions
 * TypeScript interfaces for PayHere payment gateway integration
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * PayHere webhook notification payload
 * Sent by PayHere after payment completion
 */
export interface PayHereNotification {
  merchant_id: string;
  order_id: string; // Our order number (e.g., PW-20260204-001)
  payhere_amount: string; // Amount as string (e.g., "10000.00")
  payhere_currency: string; // Currency code (e.g., "LKR")
  status_code: string; // "2"=success, "0"=pending, "-1"=cancel, "-2"=fail, "-3"=chargeback
  md5sig: string; // Signature for verification
  payment_id: string; // PayHere's payment ID
  payhere_reference?: string; // PayHere reference number
  card_holder_name?: string; // Cardholder name
  card_no?: string; // Masked card number (e.g., "************1234")
  card_expiry?: string; // Card expiry (e.g., "12/25")
  method?: string; // Payment method (VISA, MASTER, AMEX, FRIMI, etc.)
  status_message?: string; // Status message from PayHere
  custom_1?: string; // Custom field 1
  custom_2?: string; // Custom field 2
}

/**
 * Payment initiation request
 * Sent from client to initiate payment
 */
export interface PaymentInitiateRequest {
  orderId: string;
}

/**
 * Payment initiation response
 * Returned to client for PayHere redirect
 */
export interface PaymentInitiateResponse {
  success: boolean;
  data?: {
    paymentId: string; // Our payment record ID
    payhereUrl: string; // PayHere checkout URL
    paymentData: Record<string, string>; // Form data for auto-submission
  };
  error?: string;
}

/**
 * Vendor earnings breakdown
 * Used for wallet crediting calculations
 */
export interface VendorEarnings {
  vendorId: string;
  vendorName: string;
  totalAmount: Decimal; // Sum of all order items for this vendor
  commissionRate: Decimal; // Commission rate (e.g., 10.00 for 10%)
  commissionAmount: Decimal; // Calculated commission
  netAmount: Decimal; // Amount after commission deduction
  orderItemIds: string[]; // Order item IDs for this vendor
}

/**
 * Payment status from PayHere
 */
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

/**
 * Order status related to payment
 */
export type OrderPaymentStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "DELIVERY_CONFIRMED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "DISPUTED";

/**
 * Wallet transaction types
 */
export type WalletTransactionType =
  | "CREDIT" // Money added
  | "DEBIT" // Money removed
  | "HOLD" // Escrow hold (payment received)
  | "RELEASE" // Escrow release (delivery confirmed)
  | "COMMISSION" // Platform commission deduction
  | "PAYOUT" // Withdrawal processed
  | "REFUND" // Refund issued
  | "ADJUSTMENT"; // Manual adjustment by admin

/**
 * Order with payment details
 * Used in payment pages
 */
export interface OrderWithPayment {
  id: string;
  orderNumber: string;
  status: OrderPaymentStatus;
  subtotal: Decimal;
  discountAmount: Decimal;
  shippingAmount: Decimal;
  totalAmount: Decimal;
  shippingAddressJson: any;
  notes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    user: {
      email: string;
    };
  };
  items: Array<{
    id: string;
    vendorId: string;
    productSnapshot: any;
    variantSnapshot: any;
    price: Decimal;
    quantity: number;
    vendor: {
      id: string;
      businessName: string;
      commissionRate: Decimal;
    };
  }>;
  payment?: {
    id: string;
    status: PaymentStatus;
    method: string | null;
    paidAt: Date | null;
  } | null;
}
