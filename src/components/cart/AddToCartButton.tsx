"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "./QuantitySelector";
import { ShoppingCart, Heart } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/types/cart";
import { calculateFinalPrice, generateCartItemId } from "@/lib/utils/cart";
import { VariantSwatches } from "@/components/products/VariantSwatches";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceAdjustment: number | null;
  stock: number;
  sku?: string | null;
  image?: string | null;
}

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[];
    vendor: {
      id: string;
      businessName: string;
    };
    sizeChart?: string | null;
  };
  variants?: ProductVariant[];
  size?: "sm" | "md" | "lg";
  showQuantitySelector?: boolean;
  onVariantChange?: (variant: ProductVariant | null) => void;
  onImagePreview?: (url: string | null) => void;
}

export function AddToCartButton({
  product,
  variants = [],
  size = "lg",
  showQuantitySelector = true,
  onVariantChange,
  onImagePreview,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToGuestCart, addToCart, getItemQuantity } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const activeInWishlist = isInWishlist(product.id);
  const { toast } = useToast();

  const hasVariants = variants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId)
    : null;

  useEffect(() => {
    onVariantChange?.(selectedVariant ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  const availableStock = selectedVariant
    ? selectedVariant.stock
    : product.stock;

  const currentQuantityInCart = getItemQuantity(
    product.id,
    selectedVariantId
  );

  const finalPrice = calculateFinalPrice(
    product.price,
    selectedVariant?.priceAdjustment
  );

  const isOutOfStock = availableStock === 0;

  const canAdd =
    availableStock > 0 &&
    quantity + currentQuantityInCart <= availableStock &&
    (!hasVariants || selectedVariantId !== null);

  const handleAddToCart = async () => {
    if (!canAdd || isAdding) return;

    setIsAdding(true);

    try {
      if (isAuthenticated) {
        const success = await addToCart(product.id, quantity, selectedVariantId);

        if (success) {
          setQuantity(1);
        } else {
          const storeError = useCartStore.getState().error;
          toast({
            title: "Error",
            description: storeError || "Failed to add item to cart. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const cartItem: CartItem = {
          id: generateCartItemId(product.id, selectedVariantId),
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0]?.url || "",
          basePrice: product.price,
          quantity,
          variantId: selectedVariantId,
          variantName: selectedVariant?.name,
          variantValue: selectedVariant?.value,
          priceAdjustment: selectedVariant?.priceAdjustment || 0,
          finalPrice,
          stock: availableStock,
          vendorId: product.vendor.id,
          vendorName: product.vendor.businessName,
        };

        addToGuestCart(cartItem);
        setQuantity(1);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const buttonText = currentQuantityInCart > 0
    ? `In Cart (${currentQuantityInCart})`
    : "Add to Cart";

  return (
    <div className="space-y-4">
      {/* Variant Swatches */}
      {hasVariants && (
        <VariantSwatches
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelect={(id) => setSelectedVariantId(id)}
          onSelectionChange={(_, img) => onImagePreview?.(img)}
          sizeChart={product.sizeChart}
        />
      )}

      {/* Stock Info */}
      {(!hasVariants || selectedVariantId !== null) && isOutOfStock && (
        <div className="text-sm text-red-600 font-medium font-bold uppercase tracking-wider">Out of stock</div>
      )}

      {availableStock > 0 && availableStock <= 5 && (
        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-1 rounded w-fit border border-orange-100">
          Only {availableStock} left in stock
        </div>
      )}

      {/* Quantity Selector */}
      {showQuantitySelector && availableStock > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity</label>
          <QuantitySelector
            quantity={quantity}
            min={1}
            max={Math.max(1, availableStock - currentQuantityInCart)}
            onChange={setQuantity}
            size={size === "lg" ? "md" : "sm"}
          />
        </div>
      )}

      {/* Actions: Add to Cart & Wishlist */}
      <div className="flex gap-3">
        <Button
          size={size === "md" ? "lg" : size}
          onClick={handleAddToCart}
          disabled={!canAdd || isAdding}
          className={cn(
            "flex-1 h-12 text-sm font-bold uppercase tracking-widest transition-all bg-primary hover:bg-primary/90"
          )}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-12 w-12 shrink-0 transition-all border-2",
            activeInWishlist ? "text-red-500 border-red-500 bg-red-50" : "hover:text-red-500 hover:border-red-500"
          )}
          onClick={() => toggleItem(product.id)}
          title={activeInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={cn("h-5 w-5 transition-transform active:scale-125", activeInWishlist && "fill-current")} />
        </Button>
      </div>

      {/* Buy It Now Button */}
      {size === "lg" && !isOutOfStock && (
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-bold uppercase tracking-widest border-2 hover:bg-primary hover:text-white transition-all"
          onClick={async () => {
            await handleAddToCart();
            router.push("/checkout");
          }}
        >
          Buy It Now
        </Button>
      )}

      {/* Validation Messages */}
      {hasVariants && !selectedVariantId && (
        <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest bg-muted/50 py-2 rounded">
          Please select a variant to continue
        </p>
      )}

      {currentQuantityInCart > 0 && availableStock > 0 && (
        <p className="text-[10px] font-bold text-emerald-600 text-center uppercase tracking-widest">
          {currentQuantityInCart} currently in your cart
        </p>
      )}
    </div>
  );
}
