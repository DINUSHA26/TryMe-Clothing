"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Store, Hash, Boxes, Package, ArrowRight, Eye } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickViewModalProps {
    slug: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function QuickViewModal({ slug, isOpen, onClose }: QuickViewModalProps) {
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeVariant, setActiveVariant] = useState<any>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && slug) {
            fetchProduct();
        } else {
            setProduct(null);
            setActiveVariant(null);
            setSelectedImageUrl(null);
        }
    }, [isOpen, slug]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/products/${slug}`);
            const data = await response.json();
            if (data.success) {
                setProduct(data.data.product);
            } else {
                toast.error("Failed to load product details");
                onClose();
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("An error occurred");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeVariant?.image) {
            setSelectedImageUrl(activeVariant.image);
        }
    }, [activeVariant]);

    if (!isOpen) return null;

    const hasVariants = (product?.variants?.length ?? 0) > 0;
    const variantPrices = hasVariants && product
        ? product.variants.map((v: any) => product.price + (v.priceAdjustment ?? 0))
        : [];

    const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : (product?.price ?? 0);
    const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : (product?.price ?? 0);

    const displayPrice = activeVariant
        ? (product?.price ?? 0) + (activeVariant.priceAdjustment ?? 0)
        : null;

    const currentStock = activeVariant
        ? activeVariant.stock
        : (hasVariants ? product?.variants.reduce((s: number, v: any) => s + v.stock, 0) : product?.stock) ?? 0;

    const isOutOfStock = currentStock === 0;
    const isLowStock = !isOutOfStock && currentStock <= 5;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
                <DialogTitle className="sr-only">Quick View: {product?.name || "Product"}</DialogTitle>
                <div className="grid md:grid-cols-2 h-full max-h-[90vh] overflow-y-auto">
                    {/* Image Side */}
                    <div className="relative aspect-square bg-muted/30 p-8 flex items-center justify-center">
                        {loading ? (
                            <Skeleton className="w-full h-full rounded-lg" />
                        ) : product ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={selectedImageUrl || product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Info Side */}
                    <div className="p-6 md:p-8 space-y-6 flex flex-col">
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : product ? (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <Badge variant="outline" className="mb-2">
                                            {product.category?.name}
                                        </Badge>
                                        <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center text-yellow-500 bg-yellow-400/10 px-2 py-1 rounded">
                                            <Star className="w-4 h-4 fill-yellow-500 mr-1" />
                                            <span className="text-sm font-bold">{product.averageRating.toFixed(1)}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground border-l pl-4">
                                            {product.reviewCount} reviews
                                        </span>
                                    </div>

                                    <div className="text-2xl font-black text-primary">
                                        {displayPrice !== null ? (
                                            `Rs. ${displayPrice.toLocaleString("en-LK")}`
                                        ) : minPrice === maxPrice ? (
                                            `Rs. ${minPrice.toLocaleString("en-LK")}`
                                        ) : (
                                            `Rs. ${minPrice.toLocaleString("en-LK")} - ${maxPrice.toLocaleString("en-LK")}`
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOutOfStock ? (
                                            <Badge variant="destructive" className="uppercase">Out of Stock</Badge>
                                        ) : (
                                            <div className={cn(
                                                "px-2 py-1 rounded text-xs font-bold flex items-center gap-2 border",
                                                isLowStock ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-green-50 text-green-600 border-green-200"
                                            )}>
                                                {isLowStock ? <Boxes className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                                {isLowStock ? `ONLY ${currentStock} LEFT` : "IN STOCK"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex-1">
                                    <AddToCartButton
                                        product={{
                                            id: product.id,
                                            name: product.name,
                                            slug: product.slug,
                                            price: product.price,
                                            stock: product.stock,
                                            images: product.images.map((url: string) => ({ url })),
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
                                        onImagePreview={setSelectedImageUrl}
                                        size="md"
                                        showQuantitySelector={true}
                                    />
                                </div>

                                <div className="pt-4 mt-auto border-t space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Hash className="w-4 h-4" />
                                        <span>SKU: {activeVariant?.sku || product.sku || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Store className="w-4 h-4" />
                                        <span>Sold by: <span className="font-bold text-foreground">{product.vendor.businessName}</span></span>
                                    </div>

                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        View Full Details
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
