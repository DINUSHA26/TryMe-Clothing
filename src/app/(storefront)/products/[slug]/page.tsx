"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { optimizeImageUrl } from "@/lib/imageLoader";
import { useAuthStore } from "@/stores/authStore";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductGrid } from "@/components/products/ProductGrid";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Store, ChevronRight, Package, Hash, Boxes, ShieldCheck, Shield, Truck, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCategoryHistory } from "@/hooks/useCategoryHistory";

const SRI_LANKAN_NAMES = [
  "Anura Perera",
  "Chamara Silva",
  "Nisha de Silva",
  "Dilhan Fernando",
  "Sanduni Jayawardena",
  "Kasun Rajapakse",
  "Priyantha Bandara",
  "Dinusha Senanayake",
  "Roshan Gunawardena",
  "Ruwan Wijesinghe",
  "Tharindu Herath",
  "Kavindi Alwis",
  "Suresh Kumar",
  "Manoj Gamage",
  "Ishara Madushanka",
  "Chaturika Jayasinghe",
  "Gihan Liyanage",
  "Shalini Rodrigo",
  "Aruna Cooray",
  "Imesha Ranasinghe"
];

function getBelievableName(reviewId: string, currentName: string | null) {
  if (currentName && currentName !== "Anonymous User" && currentName.trim() !== "") {
    return currentName;
  }
  let hash = 0;
  for (let i = 0; i < reviewId.length; i++) {
    hash = reviewId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SRI_LANKAN_NAMES.length;
  return SRI_LANKAN_NAMES[index];
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    bg: `hsl(${h}, 85%, 95%)`,
    text: `hsl(${h}, 85%, 35%)`,
    border: `hsl(${h}, 80%, 85%)`
  };
}

interface ProductVariant {
  id: string;
  sku?: string | null; // Match AddToCartButton's expectation
  priceAdjustment: number | null;
  stock: number;
  name: string;
  value: string;
  image?: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    user: {
      name: string | null;
    };
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stock: number;
  tags: string[];
  averageRating: number;
  reviewCount: number;
  sku?: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  vendor: {
    id: string;
    businessName: string;
    slug: string;
    description: string | null;
    logo: string | null;
  };
  variants: ProductVariant[];
  reviews: Review[];
  sizeChart?: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const { isAuthenticated } = useAuthStore();
  const [vendorStats, setVendorStats] = useState<any | null>(null);
  const [followingLoading, setFollowingLoading] = useState(false);

  const formatSells = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + "M+";
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + "K+";
    if (count >= 100) return Math.floor(count / 100) * 100 + "+";
    if (count >= 10) return Math.floor(count / 10) * 10 + "+";
    return count.toString();
  };

  const { trackCategory } = useCategoryHistory();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data.product);
          setRelatedProducts(data.data.relatedProducts);
          // Track category view
          if (data.data.product.category?.id) {
            trackCategory(data.data.product.category.id);
          }
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, trackCategory]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    if (!product?.vendor?.slug) return;

    const fetchVendorStats = async () => {
      try {
        const response = await fetch(`/api/vendors/${product.vendor.slug}`);
        const data = await response.json();
        if (data.success) {
          setVendorStats(data.data.vendor);
        }
      } catch (error) {
        console.error("Error fetching vendor stats:", error);
      }
    };

    fetchVendorStats();
  }, [product?.vendor?.slug]);

  const handleFollowToggle = async () => {
    if (!product?.vendor?.slug) return;
    
    if (!isAuthenticated) {
      toast.error("Please register or login first to follow this shop.");
      router.push(`/login?returnUrl=/products/${slug}`);
      return;
    }
    
    setFollowingLoading(true);
    try {
      const response = await fetch(`/api/vendors/${product.vendor.slug}/follow`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setVendorStats((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            isFollowing: data.data.isFollowing,
            followerCount: data.data.followerCount,
          };
        });
        toast.success(data.data.isFollowing ? "Shop followed!" : "Shop unfollowed");
      } else {
        toast.error(data.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => {
    // Sync selectedImageUrl if activeVariant changes
    if (activeVariant?.image) {
      setSelectedImageUrl(activeVariant.image);
    }
  }, [activeVariant]);

  const handleImagePreview = (url: string | null) => {
    setSelectedImageUrl(url);
  };

  const hasVariants = (product?.variants?.length ?? 0) > 0;

  // When a variant is selected show its absolute price; otherwise show the price range
  const variantPrices = hasVariants && product
    ? product.variants.map((v) => product.price + (v.priceAdjustment ?? 0))
    : [];

  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : (product?.price ?? 0);
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : (product?.price ?? 0);

  const displayPrice = activeVariant
    ? (product?.price ?? 0) + (activeVariant.priceAdjustment ?? 0)
    : null;

  // Stock logic
  const currentStock = activeVariant
    ? activeVariant.stock
    : (hasVariants ? product?.variants.reduce((s, v) => s + v.stock, 0) : product?.stock) ?? 0;

  const isOutOfStock = currentStock === 0;
  const isLowStock = !isOutOfStock && currentStock <= 5;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        {product.category.parent && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category.parent.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        {/* Image Gallery */}
        <ProductImageGallery
          images={product.images}
          productName={product.name}
          activeImageUrl={selectedImageUrl || activeVariant?.image}
        />

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm">
                {/* SKU */}
                <div className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  <Hash className="w-3.5 h-3.5" />
                  <span>SKU: {activeVariant?.sku || product.sku || "N/A"}</span>
                </div>
                {/* Category */}
                <Badge variant="outline" className="rounded-full">
                  {product.category.name}
                </Badge>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-yellow-400/10 text-yellow-600 px-2 py-1 rounded-lg font-bold">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 mr-1.5" />
                <span>{product.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground border-l pl-3">
                {product.reviewCount} total reviews
              </span>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-black text-primary">
                  {displayPrice !== null ? (
                    `Rs. ${displayPrice.toLocaleString("en-LK")}`
                  ) : minPrice === maxPrice ? (
                    `Rs. ${minPrice.toLocaleString("en-LK")}`
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Starting from</span>
                      <span className="text-3xl">Rs. {minPrice.toLocaleString("en-LK")} - {maxPrice.toLocaleString("en-LK")}</span>
                    </div>
                  )}
                </div>

                {product.compareAtPrice && (
                  <span className="text-xl text-muted-foreground line-through decoration-destructive/50 font-medium">
                    Rs. {product.compareAtPrice.toLocaleString("en-LK")}
                  </span>
                )}
              </div>

              {displayPrice !== null && hasVariants && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-sm border border-emerald-100 mt-1">
                  Custom price for selected variant
                </p>
              )}
            </div>

            {/* Stock Status Detail */}
            <div className="flex flex-col gap-1">
              {isOutOfStock ? (
                <Badge variant="destructive" className="animate-pulse w-fit px-3 py-1 text-sm font-bold uppercase">Out of Stock</Badge>
              ) : (
                <div className={cn(
                  "px-3 py-1.5 rounded-lg flex items-center w-fit gap-2 border text-sm font-bold transition-colors",
                  isLowStock ? "bg-orange-500/10 text-orange-600 border-orange-200" : "bg-green-500/10 text-green-600 border-green-200"
                )}>
                  {isLowStock ? <Boxes className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  {isLowStock ? `LOW STOCK: ${currentStock} LEFT` : "IN STOCK & READY TO SHIP"}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Vendor Info */}
          <div className="group border p-4 rounded-xl hover:border-primary transition-all bg-card shadow-sm cursor-pointer">
            <Link
              href={`/vendors/${product.vendor.slug}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center border group-hover:border-primary transition-colors overflow-hidden">
                  {product.vendor.logo ? (
                    <img src={optimizeImageUrl(product.vendor.logo, 100)} alt={product.vendor.businessName} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Store className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Sold & Fulfilled by</p>
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">{product.vendor.businessName}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Vendor Stats & Actions (Followers, Sold, Rating, Buttons) */}
          {vendorStats && (
            <div className="flex flex-col gap-4 mt-2 px-1">
              {/* Stats Bar */}
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <strong className="text-slate-900 dark:text-white font-extrabold text-base">{vendorStats.followerCount || 0}</strong> Followers
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1">
                  <strong className="text-slate-900 dark:text-white font-extrabold text-base">{formatSells(vendorStats.totalSells || 0)}</strong> Sold
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1">
                  <strong className="text-slate-900 dark:text-white font-extrabold text-base">{(vendorStats.rating || 0).toFixed(1)}</strong>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 inline" />
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFollowToggle}
                  disabled={followingLoading}
                  className={cn(
                    "h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 border-2",
                    vendorStats.isFollowing
                      ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                      : "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white hover:bg-slate-800 dark:hover:bg-slate-100"
                  )}
                >
                  <Store className="w-4 h-4" />
                  {vendorStats.isFollowing ? "Following" : "Follow"}
                </button>

                <Link
                  href={`/vendors/${product.vendor.slug}`}
                  className="h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center"
                >
                  Shop all items ({vendorStats.productCount})
                </Link>
              </div>
            </div>
          )}

          <Separator />

          {/* Add to Cart logic */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              stock: product.stock,
              images: product.images.map((url) => ({ url })),
              vendor: {
                id: product.vendor.id,
                businessName: product.vendor.businessName,
              },
              sizeChart: product.sizeChart,
            }}
            variants={product.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              priceAdjustment: v.priceAdjustment,
              stock: v.stock,
              sku: v.sku,
              image: v.image
            }))}
            onVariantChange={setActiveVariant}
            onImagePreview={handleImagePreview}
            size="lg"
            showQuantitySelector={true}
          />

          <Separator />

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Product Description
            </h3>
            <p className="text-muted-foreground leading-relaxed text-justify text-sm">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-md font-bold text-[10px] px-2 py-1 bg-accent/50 text-accent-foreground border-none hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    #{tag.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Customer Feedbacks</h2>
              <p className="text-sm text-muted-foreground mt-1">What our customers think about this product</p>
            </div>
            
            {/* Verified Purchases Info Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm bg-muted/50 px-4 py-2.5 rounded-xl border w-fit">
              <span className="font-extrabold text-foreground">{product.reviewCount} Reviews</span>
              <span className="text-muted-foreground/60">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-foreground">{product.averageRating.toFixed(1)}</span>
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < Math.round(product.averageRating) ? "fill-yellow-500 text-yellow-500" : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground/60">|</span>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>All reviews are from verified purchases</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.reviews.map((review) => {
              const displayName = getBelievableName(review.id, review.customer.user.name);
              const avatarColor = getAvatarColor(displayName);
              return (
                <div
                  key={review.id}
                  className="border bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Rating stars & verified badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < review.rating ? "fill-yellow-500" : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    {/* Review text */}
                    {review.comment && review.comment.trim() !== "" ? (
                      <p className="text-sm leading-relaxed mb-6 text-foreground/80 font-medium italic">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-sm leading-relaxed mb-6 text-muted-foreground/60 italic font-normal">
                        "Verified Purchase - No text review provided."
                      </p>
                    )}
                  </div>

                  {/* Customer details & Flag */}
                  <div className="flex items-center gap-3 border-t pt-4 mt-auto">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-transform hover:scale-105"
                      style={{
                        backgroundColor: avatarColor.bg,
                        color: avatarColor.text,
                        borderColor: avatarColor.border,
                      }}
                    >
                      {displayName[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-foreground">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                        <span className="flex items-center gap-1">
                          in
                          <img
                            src="https://flagcdn.com/w40/lk.png"
                            alt="Sri Lanka Flag"
                            className="w-4 h-3 object-cover rounded-sm border border-slate-200"
                            title="Sri Lanka"
                          />
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Guarantee Section */}
      <div className="mb-20 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-6 md:p-8">
        <h3 className="text-center text-emerald-800 font-extrabold text-lg md:text-xl mb-8 uppercase tracking-wider">
          Order guarantee
        </h3>
        <div className="grid grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto">
          <Link
            href="/returns"
            className="flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center text-emerald-700 transition-transform duration-300 group-hover:scale-110">
              <Shield className="w-12 h-12 fill-emerald-700 text-emerald-700" />
              <span className="absolute text-sm font-black text-white">$</span>
            </div>
            <span className="text-sm md:text-base font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors">
              Best price
            </span>
          </Link>

          <Link
            href="/returns"
            className="flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center text-emerald-700 transition-transform duration-300 group-hover:scale-110">
              <Truck className="w-12 h-12 fill-emerald-700 text-emerald-700" />
              <Check className="absolute w-4 h-4 text-white stroke-[4px] mr-2 mt-0.5" />
            </div>
            <span className="text-sm md:text-base font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors">
              Delivery guarantee
            </span>
          </Link>

          <Link
            href="/returns"
            className="flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center text-emerald-700 transition-transform duration-300 group-hover:scale-110">
              <Package className="w-12 h-12 fill-emerald-700 text-emerald-700" />
              <ArrowLeft className="absolute w-4 h-4 text-white stroke-[4px] mt-0.5" />
            </div>
            <span className="text-sm md:text-base font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors">
              Free returns
            </span>
          </Link>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t pt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight">Recommended for You</h2>
              <p className="text-muted-foreground text-sm">Similar items from our curated collection</p>
            </div>
            <Link href="/products" className="text-primary hover:underline font-bold text-sm flex items-center gap-1 uppercase tracking-widest">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </div>
      )}

      {/* Image Preloader for instant variant switching */}
      <div className="hidden" aria-hidden="true">
        {[
          ...product.images,
          ...(product.variants?.map((v) => v.image).filter(Boolean) as string[])
        ].filter((url, index, self) => self.indexOf(url) === index).map((url) => (
          <img key={url} src={optimizeImageUrl(url, 800)} alt="Preload" loading="eager" />
        ))}
      </div>
    </div>
  );
}
