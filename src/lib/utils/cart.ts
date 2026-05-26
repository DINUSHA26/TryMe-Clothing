import { CartItem, DbCartItem } from "@/types/cart";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculate cart totals (item count and subtotal)
 */
export function calculateCartTotals(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  return {
    itemCount,
    subtotal: Number(subtotal.toFixed(2)), // Round to 2 decimal places
  };
}

/**
 * Calculate final price with variant adjustment
 */
export function calculateFinalPrice(
  basePrice: number | Decimal,
  priceAdjustment?: number | Decimal | null
): number {
  const base = typeof basePrice === "number" ? basePrice : basePrice.toNumber();
  const adjustment =
    priceAdjustment === null || priceAdjustment === undefined
      ? 0
      : typeof priceAdjustment === "number"
        ? priceAdjustment
        : priceAdjustment.toNumber();

  return Number((base + adjustment).toFixed(2));
}

/**
 * Generate cart item ID for guest cart
 * Format: productId or productId-variantId
 */
export function generateCartItemId(
  productId: string,
  variantId?: string | null
): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

/**
 * Check if quantity is valid against available stock
 */
export function isQuantityValid(
  quantity: number,
  availableStock: number
): boolean {
  return quantity > 0 && quantity <= availableStock;
}

/**
 * Format variant display text
 * Example: "Size: XL" or "Color: Red"
 */
export function formatVariantDisplay(
  variantName?: string,
  variantValue?: string
): string | undefined {
  if (!variantName || !variantValue) return undefined;
  return `${variantName}: ${variantValue}`;
}

/**
 * Convert database cart item to client cart item
 */
export function dbCartItemToCartItem(dbItem: DbCartItem): CartItem {
  const basePrice = typeof dbItem.product.price === "number"
    ? dbItem.product.price
    : dbItem.product.price.toNumber();

  const dbPriceAdjustment = dbItem.variant?.priceAdjustment;
  const priceAdjustment = (dbPriceAdjustment !== null && dbPriceAdjustment !== undefined)
    ? (typeof dbPriceAdjustment === "number" ? dbPriceAdjustment : dbPriceAdjustment.toNumber())
    : 0;

  const finalPrice = calculateFinalPrice(basePrice, priceAdjustment);
  const stock = dbItem.variant?.stock || dbItem.product.stock;

  return {
    id: dbItem.id,
    productId: dbItem.product.id,
    productName: dbItem.product.name,
    productSlug: dbItem.product.slug,
    productImage: dbItem.product.images[0]?.url || "",
    basePrice,
    quantity: dbItem.quantity,
    variantId: dbItem.variantId,
    variantName: dbItem.variant?.name,
    variantValue: dbItem.variant?.value,
    priceAdjustment,
    finalPrice,
    stock,
    vendorId: dbItem.product.vendor.id,
    vendorName: dbItem.product.vendor.businessName,
  };
}

/**
 * Convert array of database cart items to client cart items
 */
export function convertDbCartItems(dbItems: DbCartItem[]): CartItem[] {
  return dbItems.map(dbCartItemToCartItem);
}

/**
 * Format price for display (with currency)
 */
export function formatPrice(price: number | undefined | null): string {
  const safePrice = typeof price === "number" && !isNaN(price) ? price : 0;
  return `Rs. ${safePrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Get stock status message
 */
export function getStockStatus(stock: number, quantity: number): {
  status: "available" | "low" | "out" | "exceeded";
  message: string;
} {
  if (stock === 0) {
    return { status: "out", message: "Out of stock" };
  }
  if (quantity > stock) {
    return {
      status: "exceeded",
      message: `Only ${stock} available`,
    };
  }
  if (stock <= 5) {
    return {
      status: "low",
      message: `Only ${stock} left in stock`,
    };
  }
  return { status: "available", message: "In stock" };
}

/**
 * Validate if item can be added to cart
 */
export function canAddToCart(
  stock: number,
  requestedQuantity: number,
  currentQuantity: number = 0
): {
  canAdd: boolean;
  maxQuantity: number;
  message?: string;
} {
  const totalQuantity = currentQuantity + requestedQuantity;

  if (stock === 0) {
    return {
      canAdd: false,
      maxQuantity: 0,
      message: "This item is out of stock",
    };
  }

  if (totalQuantity > stock) {
    return {
      canAdd: false,
      maxQuantity: stock - currentQuantity,
      message: `Only ${stock - currentQuantity} more can be added (${stock} total available)`,
    };
  }

  return {
    canAdd: true,
    maxQuantity: stock - currentQuantity,
  };
}
