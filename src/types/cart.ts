import { Decimal } from "@prisma/client/runtime/library";

/**
 * Client-side cart item representation
 * Used in localStorage (guest cart) and components
 */
export interface CartItem {
  id: string; // productId-variantId for guest, CartItem.id for logged-in
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string; // First image URL
  basePrice: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string; // e.g., "Size"
  variantValue?: string; // e.g., "XL"
  priceAdjustment?: number; // Variant price adjustment
  finalPrice: number; // basePrice + priceAdjustment
  stock: number; // Available stock for validation
  vendorId: string;
  vendorName: string;
}

/**
 * Cart state structure
 */
export interface Cart {
  items: CartItem[];
  itemCount: number; // Total items (sum of quantities)
  subtotal: number;
  lastUpdated: Date;
}

/**
 * Database cart item (from API)
 */
export interface DbCartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: Decimal;
    stock: number;
    images: { url: string; altText?: string }[];
    vendor: {
      id: string;
      businessName: string;
    };
  };
  variantId: string | null;
  variant?: {
    id: string;
    name: string;
    value: string;
    priceAdjustment: Decimal | null;
    stock: number;
  } | null;
}

/**
 * API response for cart operations
 */
export interface CartResponse {
  success: boolean;
  data?: {
    cart: {
      id: string;
      items: DbCartItem[];
    };
    itemCount?: number;
    subtotal?: number;
  };
  error?: string;
}

/**
 * API response for add to cart
 */
export interface AddToCartResponse {
  success: boolean;
  data?: {
    cart: {
      id: string;
      items: DbCartItem[];
    };
    addedItem?: DbCartItem;
    itemCount?: number;
    subtotal?: number;
  };
  error?: string;
}

/**
 * API request to add item to cart
 */
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

/**
 * API request to update cart item quantity
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * API request to merge guest cart
 */
export interface MergeCartRequest {
  guestCartItems: {
    productId: string;
    quantity: number;
    variantId?: string | null;
  }[];
}

/**
 * API response for merge operation
 */
export interface MergeCartResponse {
  success: boolean;
  data?: {
    cart: {
      id: string;
      items: DbCartItem[];
    };
    merged: {
      itemsAdded: number;
      itemsUpdated: number;
      itemsSkipped: number;
    };
    itemCount?: number;
    subtotal?: number;
  };
  error?: string;
}

/**
 * Guest cart item (simplified for localStorage)
 */
export interface GuestCartItem {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

/**
 * Stock validation result
 */
export interface StockValidation {
  isValid: boolean;
  availableStock: number;
  message?: string;
}
