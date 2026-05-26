/**
 * Order review component showing cart items grouped by vendor
 */

"use client";

import Image from "next/image";
import { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils/cart";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Store } from "lucide-react";

interface OrderReviewProps {
  items: CartItem[];
}

export function OrderReview({ items }: OrderReviewProps) {
  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.vendorId;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorName: item.vendorName,
        items: [],
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendorName: string; items: CartItem[] }>);

  return (
    <div className="space-y-6">
      {Object.entries(itemsByVendor).map(([vendorId, vendorData]) => {
        const vendorSubtotal = vendorData.items.reduce(
          (sum, item) => sum + item.finalPrice * item.quantity,
          0
        );

        return (
          <Card key={vendorId} className="p-6">
            {/* Vendor header */}
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">{vendorData.vendorName}</h3>
            </div>

            <Separator className="mb-4" />

            {/* Items */}
            <div className="space-y-4">
              {vendorData.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Product image */}
                  <div className="relative w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {item.productName}
                    </h4>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">
                        {item.variantName}: {item.variantValue}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Qty: {item.quantity} × {formatPrice(item.finalPrice)}
                    </p>
                  </div>

                  {/* Item total */}
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.finalPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vendor subtotal */}
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Vendor Subtotal
              </span>
              <span className="font-semibold">
                {formatPrice(vendorSubtotal)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
