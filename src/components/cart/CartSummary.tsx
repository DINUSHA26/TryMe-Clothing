"use client";

import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/lib/utils/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Sparkles, AlertCircle } from "lucide-react";
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
  const { user, isAuthenticated } = useAuthStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  const isBusinessAccount =
    isAuthenticated &&
    (user?.role === "ADMIN" || user?.role === "VENDOR" || user?.role === "ADS_SELLER");

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

      {/* Business Account Warning */}
      {isBusinessAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Logged in as <strong>{user?.role === "ADMIN" ? "Admin" : user?.role === "VENDOR" ? "Vendor" : "Ads Seller"}</strong>. Business accounts cannot place marketplace orders. Please log in with a Customer account to checkout.
          </p>
        </div>
      )}

      {/* Checkout Button */}
      {showCheckoutButton && (
        <Button
          size="lg"
          className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200"
          disabled={itemCount === 0 || hasStockIssues || isBusinessAccount}
          onClick={onCheckout}
          asChild={!onCheckout && !isBusinessAccount}
        >
          {isBusinessAccount ? (
            <span>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Customer Login Required
            </span>
          ) : onCheckout ? (
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
