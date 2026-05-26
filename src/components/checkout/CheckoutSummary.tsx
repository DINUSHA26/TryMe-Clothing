/**
 * Checkout summary component showing order totals
 */

"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/cart";

interface CheckoutSummaryProps {
  itemCount: number;
  subtotal: number;
  discount?: number;
  shippingAmount?: number;
  total: number;
}

export function CheckoutSummary({
  itemCount,
  subtotal,
  discount = 0,
  shippingAmount = 0,
  total,
}: CheckoutSummaryProps) {
  return (
    <Card className="p-6 sticky top-4">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <div className="space-y-3">
        {/* Item count */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Items ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium text-green-600">
              -{formatPrice(discount)}
            </span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {shippingAmount === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(shippingAmount)
            )}
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
        Tax included. Shipping calculated at checkout.
      </p>
    </Card>
  );
}
