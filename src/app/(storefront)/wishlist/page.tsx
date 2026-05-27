"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlistStore } from "@/stores/wishlistStore";
import { toast } from "sonner";

export default function WishlistPage() {
    const { items, clearItems } = useWishlistStore();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchWishlistProducts = async () => {
            if (items.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const queryParams = items.map(id => `id=${id}`).join("&");
                const response = await fetch(`/api/products?${queryParams}&limit=100`);
                const data = await response.json();

                if (data.success) {
                    setProducts(data.data.products);
                } else {
                    toast.error("Failed to load wishlist items");
                }
            } catch (error) {
                console.error("Error fetching wishlist products:", error);
                toast.error("An error occurred while loading your wishlist");
            } finally {
                setLoading(false);
            }
        };

        fetchWishlistProducts();
    }, [items, mounted]);

    if (!mounted) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 min-h-[70vh]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">Your Wishlist</h1>
                    </div>
                    <p className="text-muted-foreground">
                        {items.length === 0
                            ? "You haven't saved any items yet."
                            : `You have ${items.length} item${items.length === 1 ? '' : 's'} saved in your wishlist.`}
                    </p>
                </div>
                {items.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-widest h-9"
                        onClick={() => {
                            if (confirm("Are you sure you want to clear your entire wishlist?")) {
                                clearItems();
                                toast.success("Wishlist cleared");
                            }
                        }}
                    >
                        Clear Wishlist
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-square w-full rounded-2xl" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="space-y-12">
                    <ProductGrid products={products} />

                    <div className="bg-muted/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-dashed hover:border-primary/50 transition-colors">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-2xl font-bold">Found something you love?</h3>
                            <p className="text-muted-foreground max-w-md">Add them to your cart now to make sure you don't miss out on our limited collections.</p>
                        </div>
                        <Button size="lg" className="rounded-full px-8 font-bold gap-2 group" asChild>
                            <Link href="/products">
                                Continue Shopping
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3">Your wishlist is empty</h2>
                    <p className="text-muted-foreground max-w-sm mb-8">
                        Browse our latest collections and find your new favorite styles to save them here for later.
                    </p>
                    <Button size="lg" className="rounded-full px-10 font-black tracking-widest uppercase text-sm bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200" asChild>
                        <Link href="/products">
                            Explore Products
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
