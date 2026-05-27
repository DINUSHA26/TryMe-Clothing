"use client";

import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils/cart";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, X, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { QuantitySelector } from "./QuantitySelector";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    removeGuestCartItem,
    removeCartItem,
    updateCartItem,
    updateGuestCartItem,
    promoCode
  } = useCartStore();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (isAuthenticated) {
      await updateCartItem(itemId, quantity);
    } else {
      updateGuestCartItem(itemId, quantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (isAuthenticated) {
      await removeCartItem(itemId);
    } else {
      removeGuestCartItem(itemId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({itemCount})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Your shopping cart items
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Your cart is empty
            </p>
            <Button onClick={() => onOpenChange(false)} className="bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Image */}
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex-shrink-0 relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden"
                    >
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/products/${item.productSlug}`}
                          onClick={() => onOpenChange(false)}
                          className="font-medium text-sm hover:underline line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive p-1 -m-1"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variantName && item.variantValue && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.variantName}: {item.variantValue}
                        </p>
                      )}

                      <p className="text-sm font-semibold mt-1">
                        {formatPrice(item.finalPrice ?? item.basePrice)}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <QuantitySelector
                          quantity={item.quantity}
                          min={1}
                          max={item.stock}
                          size="sm"
                          onChange={(newQty) => handleUpdateQuantity(item.id, newQty)}
                        />
                        <p className="text-sm font-bold">
                          {formatPrice((item.finalPrice ?? item.basePrice) * item.quantity)}
                        </p>
                      </div>

                      {item.stock === 0 && (
                        <p className="text-xs text-red-600 mt-1">Out of stock</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="flex flex-col gap-4 pt-2">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Promo Status */}
              {promoCode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-blue-700">
                    Deal <strong>{promoCode}</strong> captured! We&apos;ll apply it at checkout.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/cart">View Full Cart</Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
