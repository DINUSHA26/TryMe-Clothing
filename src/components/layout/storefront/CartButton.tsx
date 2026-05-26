"use client";

import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

export function CartButton() {
  const { isAuthenticated, user } = useAuthStore();
  const { items, fetchCart, isOpen, setOpen } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";

  useEffect(() => {
    // Only fetch cart for authenticated customers — not vendors or admins
    if (isCustomer) {
      fetchCart();
    }
  }, [isCustomer, fetchCart]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount}
          </Badge>
        )}
      </Button>

      <CartDrawer open={isOpen} onOpenChange={setOpen} />
    </>
  );
}
