"use client";

import { CartItem as CartItemType } from "@/types/cart";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { QuantitySelector } from "./QuantitySelector";
import { formatPrice, getStockStatus } from "@/lib/utils/cart";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface CartItemProps {
  item: CartItemType;
  showVendor?: boolean;
}

export function CartItem({ item, showVendor = true }: CartItemProps) {
  const { isAuthenticated } = useAuthStore();
  const { updateGuestCartItem, removeGuestCartItem, updateCartItem, removeCartItem } =
    useCartStore();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const stockStatus = getStockStatus(item.stock, item.quantity);

  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating) return;

    setIsUpdating(true);

    if (isAuthenticated) {
      await updateCartItem(item.id, newQuantity);
    } else {
      updateGuestCartItem(item.id, newQuantity);
    }

    setIsUpdating(false);
  };

  const handleRemove = async () => {
    if (isRemoving) return;

    setIsRemoving(true);

    if (isAuthenticated) {
      await removeCartItem(item.id);
    } else {
      removeGuestCartItem(item.id);
    }

    setIsRemoving(false);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <Link
        href={`/products/${item.productSlug}`}
        className="flex-shrink-0 relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden"
      >
        <Image
          src={item.productImage}
          alt={item.productName}
          fill
          sizes="96px"
          className="object-cover"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        {/* Name & Vendor */}
        <div className="mb-1">
          <Link
            href={`/products/${item.productSlug}`}
            className="font-medium text-sm hover:underline line-clamp-2"
          >
            {item.productName}
          </Link>
          {showVendor && (
            <p className="text-xs text-muted-foreground mt-0.5">
              by {item.vendorName}
            </p>
          )}
        </div>

        {/* Variant */}
        {item.variantName && item.variantValue && (
          <p className="text-sm text-muted-foreground mb-2">
            {item.variantName}: <span className="font-medium">{item.variantValue}</span>
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <p className="font-semibold">{formatPrice(item.finalPrice)}</p>
          {!!item.priceAdjustment && item.priceAdjustment !== 0 && (
            <span className="text-xs text-muted-foreground">
              (Base: {formatPrice(item.basePrice)})
            </span>
          )}
        </div>

        {/* Stock Warning */}
        {(stockStatus.status === "out" ||
          stockStatus.status === "exceeded" ||
          stockStatus.status === "low") && (
          <div className="flex items-center gap-1.5 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <Badge
              variant={
                stockStatus.status === "out" || stockStatus.status === "exceeded"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs"
            >
              {stockStatus.message}
            </Badge>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center gap-4">
          <QuantitySelector
            quantity={item.quantity}
            min={1}
            max={item.stock}
            onChange={handleQuantityChange}
            disabled={isUpdating || item.stock === 0}
            size="sm"
          />

          {/* Subtotal */}
          <p className="text-sm font-medium">
            {formatPrice(item.finalPrice * item.quantity)}
          </p>
        </div>
      </div>

      {/* Remove Button */}
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Remove item"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
