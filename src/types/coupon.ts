/**
 * Coupon types for discount validation and application
 */

import { CouponType, CouponApplicableTo } from "@prisma/client";

export { CouponApplicableTo };

/**
 * Coupon validation result
 */
export interface CouponValidation {
  isValid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number | null;
    maxDiscount?: number | null;
    vendorId?: string | null;
    applicableTo?: CouponApplicableTo;
  };
  discount?: {
    amount: number;
    type: CouponType;
    originalSubtotal: number;
    finalSubtotal: number;
  };
  error?: string;
}

/**
 * API request for coupon validation
 */
export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
  cartItems: {
    productId: string;
    vendorId: string;
    quantity: number;
    price: number;
  }[];
  channel?: "TRYME" | "OWN_WEBSITE";
}

/**
 * API response for coupon validation
 */
export interface ValidateCouponResponse {
  success: boolean;
  data?: CouponValidation;
  error?: string;
}
