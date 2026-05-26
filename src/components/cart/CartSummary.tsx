"use client";

import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
}

export function CartSummary({
  showCheckoutButton = true,
  onCheckout,
}: CartSummaryProps) {
  const { items, promoCode } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  const hasStockIssues = items.some(
    (item) => item.stock === 0 || item.quantity > item.stock
  );

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>

      {/* Promo Status */}
      {promoCode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <p className="text-xs text-blue-700">
            Deal <strong>{promoCode}</strong> captured!
          </p>
        </div>
      )}

      <Separator />

      {/* Item Count */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Items ({itemCount})
        </span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>

      {/* Shipping Note */}
      <div className="text-xs text-muted-foreground">
        Shipping and taxes will be calculated at checkout
      </div>

      <Separator />

      {/* Subtotal */}
      <div className="flex justify-between text-base font-semibold">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      {/* Stock Warning */}
      {hasStockIssues && showCheckoutButton && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs text-red-700">
            Some items in your cart are out of stock or exceed available
            quantity. Please update your cart before proceeding.
          </p>
        </div>
      )}

      {/* Checkout Button */}
      {showCheckoutButton && (
        <Button
          size="lg"
          className="w-full"
          disabled={itemCount === 0 || hasStockIssues}
          onClick={onCheckout}
          asChild={!onCheckout}
        >
          {onCheckout ? (
            <span>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </span>
          ) : (
            <Link href="/checkout">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Link>
          )}
        </Button>
      )}

      {/* Continue Shopping */}
      {showCheckoutButton && (
        <Link href="/products">
          <Button variant="outline" size="lg" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      )}
    </div>
  );
}
