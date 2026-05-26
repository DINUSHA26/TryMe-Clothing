/**
 * Order utility functions
 */

import { Decimal } from "@prisma/client/runtime/library";
import { CouponType, OrderStatus, RefundStatus } from "@prisma/client";

/**
 * Generate unique order number
 * Format: PW-YYYYMMDD-XXX
 * Where XXX is a 3-digit sequential number for that day
 */
export async function generateOrderNumber(prisma: any): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const datePrefix = `PW-${year}${month}${day}`;

  // Get count of orders created today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const todayOrderCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Sequential number (1-based)
  const sequence = String(todayOrderCount + 1).padStart(3, "0");

  return `${datePrefix}-${sequence}`;
}

/**
 * Calculate discount amount based on coupon
 */
export function calculateDiscount(
  subtotal: number,
  couponType: CouponType,
  couponValue: number | Decimal,
  maxDiscount?: number | Decimal | null
): number {
  const value =
    typeof couponValue === "number" ? couponValue : couponValue.toNumber();

  let discount = 0;

  if (couponType === "FLAT") {
    discount = value;
  } else if (couponType === "PERCENTAGE") {
    discount = (subtotal * value) / 100;

    // Apply max discount cap if specified
    if (maxDiscount) {
      const maxDiscountNum =
        typeof maxDiscount === "number" ? maxDiscount : maxDiscount.toNumber();
      discount = Math.min(discount, maxDiscountNum);
    }
  }

  // Ensure discount doesn't exceed subtotal
  return Math.min(discount, subtotal);
}

/**
 * Create product snapshot for order item
 */
export function createProductSnapshot(product: any): any {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images[0]?.url || "",
    basePrice: product.price.toNumber(),
    vendorId: product.vendor.id,
    vendorName: product.vendor.businessName,
  };
}

/**
 * Create variant snapshot for order item
 */
export function createVariantSnapshot(variant: any): any | null {
  if (!variant) return null;

  return {
    variantId: variant.id,
    name: variant.name,
    value: variant.value,
    priceAdjustment: variant.priceAdjustment?.toNumber() || 0,
  };
}

/**
 * Calculate final price with variant adjustment
 */
export function calculateItemPrice(
  basePrice: number | Decimal,
  priceAdjustment?: number | Decimal | null
): number {
  const base =
    typeof basePrice === "number" ? basePrice : basePrice.toNumber();
  const adjustment = priceAdjustment
    ? typeof priceAdjustment === "number"
      ? priceAdjustment
      : priceAdjustment.toNumber()
    : 0;

  return Number((base + adjustment).toFixed(2));
}

/**
 * Validate stock availability for cart items
 */
export function validateStockAvailability(cartItems: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const item of cartItems) {
    const product = item.product;
    const variant = item.variant;
    const availableStock = variant ? variant.stock : product.stock;

    if (availableStock === 0) {
      errors.push(`${product.name} is out of stock`);
    } else if (item.quantity > availableStock) {
      errors.push(
        `${product.name}: Only ${availableStock} available (requested ${item.quantity})`
      );
    }

    // Check if product is active
    if (!product.isActive || product.isDisabledByAdmin) {
      errors.push(`${product.name} is no longer available`);
    }

    // Check if vendor is active
    if (product.vendor.status !== "ACTIVE" || !product.vendor.user.isActive) {
      errors.push(`${product.name} is from an inactive vendor`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate status transition based on role and business rules
 *
 * @param currentStatus - Current order status
 * @param newStatus - Desired new status
 * @param role - User role (CUSTOMER, VENDOR, ADMIN)
 * @param orderCreatedAt - Order creation timestamp
 * @param deliveryConfirmedAt - Delivery confirmation timestamp (if confirmed)
 * @returns Validation result with error message if invalid
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  role: "CUSTOMER" | "VENDOR" | "ADMIN",
  orderCreatedAt: Date,
  deliveryConfirmedAt?: Date | null
): { isValid: boolean; error?: string } {
  const now = new Date();

  // Customer-specific validations
  if (role === "CUSTOMER") {
    if (newStatus === "CANCELLED") {
      // Can cancel within 24h if not yet shipped
      if (!["PENDING_PAYMENT", "PAYMENT_CONFIRMED"].includes(currentStatus)) {
        return {
          isValid: false,
          error: "Cannot cancel order after it has been shipped"
        };
      }

      const hoursSinceOrder = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceOrder > 24) {
        return {
          isValid: false,
          error: "Cancellation window (24 hours) has expired"
        };
      }

      return { isValid: true };
    }

    // Customer marks order as DELIVERED (new canonical delivery confirmation)
    if (newStatus === "DELIVERED") {
      if (currentStatus !== "SHIPPED") {
        return {
          isValid: false,
          error: "Order must be shipped before you can confirm delivery"
        };
      }
      return { isValid: true };
    }

    // Legacy: DELIVERY_CONFIRMED still accepted for backward compatibility
    if (newStatus === "DELIVERY_CONFIRMED") {
      if (!["SHIPPED", "DELIVERED"].includes(currentStatus)) {
        return {
          isValid: false,
          error: "Order must be shipped before you can confirm delivery"
        };
      }
      return { isValid: true };
    }

    if (newStatus === "RETURN_REQUESTED") {
      if (!["DELIVERY_CONFIRMED", "DELIVERED"].includes(currentStatus)) {
        return {
          isValid: false,
          error: "Can only request return after delivery is confirmed"
        };
      }

      if (!deliveryConfirmedAt) {
        return {
          isValid: false,
          error: "Delivery confirmation date not found"
        };
      }

      const hoursSinceDelivery = (now.getTime() - deliveryConfirmedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDelivery > 24) {
        return {
          isValid: false,
          error: "Return window (24 hours) has expired"
        };
      }

      return { isValid: true };
    }

    // Customer cannot perform other status transitions
    return {
      isValid: false,
      error: "Invalid status transition for customer"
    };
  }

  // Vendor-specific validations
  if (role === "VENDOR") {
    const allowedTransitions: Record<string, string[]> = {
      PAYMENT_CONFIRMED: ["PROCESSING"],
      PROCESSING: ["SHIPPED"],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`
      };
    }

    return { isValid: true };
  }

  // Admin can do any transition (but should have good reason in UI)
  if (role === "ADMIN") {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Invalid role"
  };
}

/**
 * Calculate available actions for an order
 * Used to determine which action buttons to show in UI
 *
 * @param order - Order with status and timestamps
 * @returns Object with action availability flags and reason messages
 */
export function calculateOrderActions(order: {
  status: OrderStatus;
  createdAt: Date;
  deliveryConfirmedAt?: Date | null;
}): {
  canCancel: boolean;
  canConfirmDelivery: boolean;
  canRequestReturn: boolean;
  canOpenDispute: boolean;
  canComplete: boolean;
  cancelReason?: string;
  returnReason?: string;
} {
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60);
  const hoursSinceDelivery = order.deliveryConfirmedAt
    ? (now.getTime() - order.deliveryConfirmedAt.getTime()) / (1000 * 60 * 60)
    : null;

  return {
    canCancel:
      ["PENDING_PAYMENT", "PAYMENT_CONFIRMED"].includes(order.status) &&
      hoursSinceOrder <= 24,
    cancelReason:
      hoursSinceOrder > 24
        ? "Cancellation window expired (must be within 24 hours of order placement)"
        : ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)
        ? "Order already shipped or delivered"
        : undefined,
    // Customer can confirm from SHIPPED only (clicking → DELIVERED + funds released)
    // DELIVERED and DELIVERY_CONFIRMED are already terminal delivery states
    canConfirmDelivery: order.status === "SHIPPED",
    canRequestReturn:
      ["DELIVERED", "DELIVERY_CONFIRMED"].includes(order.status) &&
      (hoursSinceDelivery ?? 0) <= 24,
    returnReason:
      (hoursSinceDelivery ?? 0) > 24
        ? "Return window expired (must be within 24 hours of delivery confirmation)"
        : undefined,
    canOpenDispute:
      ["DELIVERED", "DELIVERY_CONFIRMED"].includes(order.status) &&
      (hoursSinceDelivery ?? 0) <= 24,
    canComplete:
      ["DELIVERED", "DELIVERY_CONFIRMED"].includes(order.status) &&
      (hoursSinceDelivery ?? 0) <= 24,
  };
}

/**
 * Calculate available actions for an individual order item
 * 
 * @param item - Order item with status and timestamps
 * @returns Object with action availability flags
 */
export function calculateItemActions(item: {
  status: OrderStatus;
  deliveryConfirmedAt?: Date | null;
  refundStatus: RefundStatus;
  disputeId?: string | null;
  isReturnable: boolean;
  orderStatus?: OrderStatus;
  hasReview?: boolean;
}): {
  canRequestReturn: boolean;
  canOpenDispute: boolean;
  canReview: boolean;
  returnReason?: string;
} {
  const now = new Date();
  const hoursSinceDelivery = item.deliveryConfirmedAt
    ? (now.getTime() - item.deliveryConfirmedAt.getTime()) / (1000 * 60 * 60)
    : null;

  // Basic eligibility: must be delivered and within window
  // Fallback: if order is delivered but item is still shipped, consider it delivered for return/dispute
  const isDelivered = 
    ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(item.status) ||
    Boolean(item.orderStatus && ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(item.orderStatus) && item.status === "SHIPPED");
  
  const isCompleted = item.status === "COMPLETED" || item.orderStatus === "COMPLETED";

  // Return rules:
  // 1. Must be delivered
  // 2. Must be within 24h of delivery
  // 3. Must not already have a return/refund pending or completed
  // 4. Item must be marked as returnable
  // 5. Must not be completed
  const canRequestReturn = 
    !isCompleted &&
    isDelivered && 
    item.isReturnable &&
    item.refundStatus === "NONE" &&
    (hoursSinceDelivery ?? 0) <= 24;

  // Dispute rules:
  // 1. Must be delivered
  // 2. Must be within 24h of delivery
  // 3. Must not already have a dispute linked
  // 4. Must not be completed
  const canOpenDispute = 
    !isCompleted &&
    isDelivered && 
    !item.disputeId &&
    (hoursSinceDelivery ?? 0) <= 24;

  // Review rules:
  // 1. Must be delivered
  // 2. Allow reviewing/editing as long as it's delivered
  const canReview = isDelivered;

  return {
    canRequestReturn,
    canOpenDispute,
    canReview,
    returnReason: (hoursSinceDelivery ?? 25) > 24 ? "Return window expired" : undefined
  };
}
