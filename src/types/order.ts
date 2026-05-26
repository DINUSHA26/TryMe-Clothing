/**
 * Order types for order creation and management
 */

import { OrderStatus } from "@prisma/client";
import { AddressSnapshot } from "./address";

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  shippingAddressId: string;
  couponCode?: string | null;
  notes?: string | null;
}

/**
 * Order item snapshot (immutable)
 */
export interface OrderItemSnapshot {
  productId: string;
  name: string;
  slug: string;
  image: string;
  basePrice: number;
  vendorId: string;
  vendorName: string;
}

/**
 * Variant snapshot (immutable)
 */
export interface VariantSnapshot {
  variantId: string;
  name: string;
  value: string;
  priceAdjustment: number;
}

/**
 * Order creation result
 */
export interface OrderCreationResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  itemCount: number;
}

/**
 * API response for order creation
 */
export interface CreateOrderResponse {
  success: boolean;
  data?: OrderCreationResult;
  error?: string;
}

/**
 * Checkout validation result
 */
export interface CheckoutValidation {
  isValid: boolean;
  errors: {
    type: "stock" | "address" | "cart" | "vendor";
    message: string;
    productId?: string;
  }[];
  warnings: {
    type: "low_stock";
    message: string;
    productId: string;
  }[];
}

/**
 * API response for checkout validation
 */
export interface CheckoutValidationResponse {
  success: boolean;
  data?: CheckoutValidation;
  error?: string;
}

/**
 * Order actions available to customer
 */
export interface OrderActions {
  canCancel: boolean;
  canConfirmDelivery: boolean;
  canRequestReturn: boolean;
  cancelReason?: string;
  returnReason?: string;
}

/**
 * Order status history item
 */
export interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  createdBy: {
    email: string;
    role: string | null;
  } | null;
}

/**
 * Order list item (for customer/vendor/admin lists)
 */
export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  itemImages: (string | null)[];
}

/**
 * Vendor order group (items from same vendor)
 */
export interface VendorOrderGroup {
  vendorName: string;
  items: OrderItemDetails[];
  status: OrderStatus;
}

/**
 * Order item details
 */
export interface OrderItemDetails {
  id: string;
  productSnapshot: OrderItemSnapshot;
  variantSnapshot?: VariantSnapshot | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  discountedTotalPrice?: number;
  status: OrderStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

/**
 * Complete order details
 */
export interface OrderDetails {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    notes: string | null;
    createdAt: string;
    shippingSnapshot: AddressSnapshot;
    couponSnapshot?: {
      code: string;
      discountType: string;
      discountValue: number;
    } | null;
    payment?: {
      status: string;
      paymentMethod: string;
      paidAt: string | null;
    } | null;
    cancelReason?: string | null;
    cancelledAt?: string | null;
    deliveryConfirmedAt?: string | null;
    customer?: {
      user: {
        email: string;
      };
    };
  };
  statusHistory: OrderStatusHistoryItem[];
  itemsByVendor: VendorOrderGroup[];
  actions?: OrderActions;
}

/**
 * Cancel order request
 */
export interface CancelOrderRequest {
  reason: string;
}

/**
 * Request return request
 */
export interface RequestReturnRequest {
  reason: string;
  description?: string | null;
}

/**
 * Update order item status request (vendor)
 */
export interface UpdateOrderItemStatusRequest {
  status: "PROCESSING" | "SHIPPED";
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  note?: string | null;
}

/**
 * Override order status request (admin)
 */
export interface OverrideOrderStatusRequest {
  status: OrderStatus;
  reason: string;
}
