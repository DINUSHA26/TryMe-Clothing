"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Star, Loader2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { QuickViewModal } from "./QuickViewModal";
import { generateCartItemId } from "@/lib/utils/cart";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    displayPrice?: number;
    totalStock?: number;
    hasVariants?: boolean;
    images: string[];
    stock: number;
    averageRating?: number;
    reviewCount?: number;
    category?: {
      name: string;
      slug: string;
    };
    vendor?: {
      id?: string;
      businessName: string;
      slug: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  const activeImageIndex = hoveredImageIndex !== null ? hoveredImageIndex : selectedImageIndex;

  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addToCart, addToGuestCart, setOpen } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const activeInWishlist = isInWishlist(product.id);

  const shownPrice = product.displayPrice ?? product.price;
  const effectiveStock = product.totalStock ?? product.stock;
  const isOutOfStock = effectiveStock === 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    // If it has variants, we MUST show the quick view to pick a variant
    if (product.hasVariants) {
      setIsQuickViewOpen(true);
      return;
    }

    // Direct add for simple products
    setIsAdding(true);
    try {
      if (isAuthenticated) {
        const success = await addToCart(product.id, 1);
        if (success) {
          setOpen(true);
        }
      } else {
        addToGuestCart({
          id: generateCartItemId(product.id),
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0] || "",
          basePrice: product.price,
          quantity: 1,
          priceAdjustment: 0,
          finalPrice: product.price,
          stock: product.stock,
          vendorId: product.vendor?.id || "",
          vendorName: product.vendor?.businessName || "Generic Vendor",
        });
        setOpen(true);
      }
    } catch (error) {
      console.error("Quick Add Error:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="group h-full flex flex-col">
        <Card className="relative h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-card/50 backdrop-blur-sm group-hover:-translate-y-1">
          {/* Action Icons (Top Right) */}
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 lg:translate-x-12 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 transition-all duration-300 ease-out">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItem(product.id);
              }}
              className={cn(
                "p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
                activeInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-white/90 backdrop-blur-sm text-gray-900 hover:text-red-500"
              )}
              title={activeInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={cn("w-4 h-4 md:w-5 md:h-5", activeInWishlist && "fill-current")} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg transition-all hover:scale-110 active:scale-95 hover:text-primary"
              title="Quick View"
            >
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <Link href={`/products/${product.slug}`} className="block h-full cursor-pointer">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/40">
              {product.images?.[activeImageIndex] ? (
                <Image
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out",
                    isAdding && "opacity-50 grayscale"
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              {/* Quick Add Bar */}
              {!isOutOfStock && (
                <div className="absolute bottom-0 left-0 right-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                  <button
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className="w-full bg-[#00155a] py-2 md:py-3 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-[#00155a]/90 transition-all shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1 md:gap-2 group/btn active:scale-95"
                  >
                    {isAdding ? (
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-3 w-3.5 h-3 h-3.5 md:flex hidden opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                        Quick Add
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Stock Badge */}
              {isOutOfStock && (
                <Badge
                  variant="destructive"
                  className="absolute bottom-2 left-2 px-3 py-1 font-bold uppercase tracking-widest text-[10px] rounded-sm transition-transform duration-300 group-hover:-translate-y-12"
                >
                  Sold Out
                </Badge>
              )}
              {isLowStock && (
                <Badge
                  className="absolute bottom-2 left-2 bg-orange-500 text-white px-3 py-1 font-bold uppercase tracking-widest text-[10px] rounded-sm border-none transition-transform duration-300 group-hover:-translate-y-12"
                >
                  Low Stock
                </Badge>
              )}
            </div>

            <CardContent className="p-2 md:p-4 space-y-1.5 md:space-y-2">
              {/* Variant Preview Circles */}
              {product.images && product.images.length > 1 && (
                <div 
                  className="flex items-center gap-1.5 py-0.5"
                  onMouseLeave={() => setHoveredImageIndex(null)}
                >
                  {product.images.slice(0, 3).map((imgUrl, idx) => (
                    <button
                      key={imgUrl}
                      type="button"
                      onMouseEnter={() => setHoveredImageIndex(idx)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 overflow-hidden transition-all duration-200 hover:scale-110 relative flex items-center justify-center p-0.5 bg-background",
                        activeImageIndex === idx
                          ? "border-slate-800 scale-105"
                          : "border-gray-200 hover:border-gray-400"
                      )}
                    >
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={imgUrl}
                          alt={`Variant preview ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Category */}
              {product.category && (
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {product.category.name}
                </p>
              )}

              {/* Product Name */}
              <h3 className="font-bold text-xs md:text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem] md:min-h-[2.5rem]">
                {product.name}
              </h3>

              {/* Rating */}
              {product.averageRating !== undefined && product.reviewCount !== undefined && (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="flex items-center">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold ml-1">
                      {product.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium border-l pl-2">
                    {product.reviewCount} reviews
                  </span>
                </div>
              )}

              {/* Price & Vendor */}
              <div className="flex flex-col gap-0.5 md:gap-1 pt-0.5 md:pt-1">
                <p className="text-sm md:text-base font-black text-primary">
                  Rs. {shownPrice.toLocaleString("en-LK")}
                </p>
                {product.vendor && (
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-semibold truncate">
                    By <span className="text-foreground/80">{product.vendor.businessName}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <QuickViewModal
        slug={product.slug}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
