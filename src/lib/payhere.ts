/**
 * PayHere Payment Gateway Integration
 * Handles hash generation, signature verification, and payment request building
 */

import crypto from "crypto";
import { getAppUrl } from "./env";

/**
 * Get PayHere URL based on mode (sandbox or live)
 */
export function getPayHereURL(): string {
  const mode = process.env.PAYHERE_MODE || "sandbox";
  return mode === "live"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";
}

/**
 * Generate MD5 hash for PayHere payment request
 * Formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()
 *
 * @param merchantId - PayHere merchant ID
 * @param orderId - Our order number (e.g., PW-20260204-001)
 * @param amount - Amount in LKR (e.g., "10000.00")
 * @param currency - Currency code (e.g., "LKR")
 * @param merchantSecret - PayHere merchant secret (NEVER expose to client)
 * @returns Uppercase MD5 hash
 */
export function generatePaymentHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string
): string {
  // Step 1: Hash the merchant secret and convert to uppercase
  const merchantSecretHash = crypto
    .createHash("md5")
    .update(merchantSecret.trim())
    .digest("hex")
    .toUpperCase();

  // Step 2: Concatenate values and hash
  const hashString = merchantId + orderId + amount + currency + merchantSecretHash;
  const hash = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return hash;
}

/**
 * Verify PayHere webhook signature
 * Regenerates hash and compares with md5sig from payload
 *
 * @param payload - PayHere webhook payload
 * @param merchantSecret - PayHere merchant secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: {
    merchant_id: string;
    order_id: string;
    payhere_amount: string;
    payhere_currency: string;
    status_code: string;
    md5sig: string;
  },
  merchantSecret: string
): boolean {
  // Step 1: Hash the merchant secret and convert to uppercase
  const merchantSecretHash = crypto
    .createHash("md5")
    .update(merchantSecret.trim())
    .digest("hex")
    .toUpperCase();

  // Step 2: Regenerate hash from payload
  const hashString =
    payload.merchant_id +
    payload.order_id +
    payload.payhere_amount +
    payload.payhere_currency +
    payload.status_code +
    merchantSecretHash;

  const expectedSignature = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  // Step 3: Compare signatures using constant-time comparison (prevents timing attacks)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(payload.md5sig.toUpperCase()),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // If lengths don't match, timingSafeEqual throws
    return false;
  }
}

/**
 * Build PayHere payment request data
 *
 * @param order - Order object with customer and items
 * @param payment - Payment record
 * @param customer - Customer object with user details
 * @returns Payment form data for auto-submission
 */
export function buildPaymentRequest(
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    shippingAddressJson: any;
    customer: {
      user: {
        email: string;
      };
    };
  },
  payment: {
    id: string;
  },
  hash: string
): Record<string, string> {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
  const appUrl = getAppUrl();

  // Parse shipping address from JSON
  const shippingAddress = order.shippingAddressJson as {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
  };

  // Split full name into first and last name
  const nameParts = shippingAddress.fullName.trim().split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Format amount to 2 decimal places
  const formattedAmount = order.totalAmount.toFixed(2);

  return {
    merchant_id: merchantId,
    return_url: `${appUrl}/payment/success/${order.id}`,
    cancel_url: `${appUrl}/payment/cancel/${order.id}`,
    notify_url: `${appUrl}/api/payments/webhook`,
    order_id: order.orderNumber,
    items: `Order ${order.orderNumber}`,
    currency: "LKR",
    amount: formattedAmount,
    first_name: firstName,
    last_name: lastName,
    email: order.customer.user.email,
    phone: shippingAddress.phone,
    address: `${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ", " + shippingAddress.addressLine2 : ""}`,
    city: shippingAddress.city,
    country: "Sri Lanka",
    hash: hash,
  };
}

/**
 * Format amount for PayHere (2 decimal places)
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parse PayHere status code
 */
export function parseStatusCode(statusCode: string): {
  status: "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED" | "CHARGEDBACK";
  message: string;
} {
  switch (statusCode) {
    case "2":
      return { status: "COMPLETED", message: "Payment successful" };
    case "0":
      return { status: "PENDING", message: "Payment pending" };
    case "-1":
      return { status: "CANCELLED", message: "Payment cancelled by user" };
    case "-2":
      return { status: "FAILED", message: "Payment failed" };
    case "-3":
      return { status: "CHARGEDBACK", message: "Payment chargedback" };
    default:
      return { status: "FAILED", message: "Unknown status code" };
  }
}
