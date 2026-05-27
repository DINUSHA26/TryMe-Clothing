"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Package, Loader2, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCategoryHistory } from "@/hooks/useCategoryHistory";

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    children: Category[];
    _count?: {
        products: number;
    };
}

const FEATURED_CATEGORY_ID = "featured-special-id";

export function CategoryMegaMenu() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFeatured, setLoadingFeatured] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { history } = useCategoryHistory();

    useEffect(() => {
        async function fetchRootCategories() {
            try {
                const response = await fetch("/api/categories?parentId=null");
                const json = await response.json();
                if (json.success) {
                    const rootCats = json.data.categories;

                    // Create Featured virtual category
                    const featured: Category = {
                        id: FEATURED_CATEGORY_ID,
                        name: "Featured",
                        slug: "featured",
                        image: null,
                        children: [],
                    };

                    const combined = [featured, ...rootCats];
                    setCategories(combined);
                    if (combined.length > 0) {
                        setActiveCategory(combined[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchRootCategories();
    }, []);

    // Fetch featured categories when 'Featured' is active
    useEffect(() => {
        if (activeCategory?.id === FEATURED_CATEGORY_ID && history.length > 0) {
            const fetchFeatured = async () => {
                setLoadingFeatured(true);
                try {
                    const response = await fetch(`/api/categories?ids=${history.join(",")}`);
                    const json = await response.json();
                    if (json.success) {
                        // Preserving history order
                        const fetched = json.data.categories as Category[];
                        const sorted = history
                            .map(id => fetched.find(cat => cat.id === id))
                            .filter(Boolean) as Category[];

                        setFeaturedCategories(sorted);
                    }
                } catch (error) {
                    console.error("Error fetching featured categories:", error);
                } finally {
                    setLoadingFeatured(false);
                }
            };
            fetchFeatured();
        }
    }, [activeCategory, history]);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={menuRef}
        >
            <button
                onClick={toggleMenu}
                className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors hover:text-white relative pb-3",
                    isOpen
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white font-semibold"
                        : "text-white/80"
                )}
            >
                <span className="flex items-center gap-2">
                    Categories
                </span>
                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[950px] max-w-[95vw] bg-white dark:bg-slate-950 border rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-black/5">
                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">Tailoring your experience...</p>
                        </div>
                    ) : (
                        <div className="flex h-[520px]">
                            {/* Sidebar - Main Categories */}
                            <div className="w-[240px] border-r bg-slate-50/30 dark:bg-slate-900/30">
                                <ScrollArea className="h-full">
                                    <div className="py-3 px-1.5">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onMouseEnter={() => setActiveCategory(cat)}
                                                onClick={() => {
                                                    if (cat.id !== FEATURED_CATEGORY_ID) {
                                                        router.push(`/categories/${cat.slug}`);
                                                        setIsOpen(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-3.5 text-sm transition-all duration-200 rounded-xl mb-1 relative group",
                                                    activeCategory?.id === cat.id
                                                        ? "bg-white dark:bg-slate-900 text-primary font-bold shadow-md ring-1 ring-black/5 dark:ring-white/5"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-primary"
                                                )}
                                            >
                                                <span className="truncate pr-2">{cat.name}</span>
                                                <ChevronRight className={cn("h-3.5 w-3.5 transition-all", activeCategory?.id === cat.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2")} />
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Content - Sub Categories */}
                            <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col">
                                {activeCategory ? (
                                    <>
                                        <div className="px-8 py-5 border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 flex items-center">
                                            {activeCategory.id === FEATURED_CATEGORY_ID ? (
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recommended for You</h3>
                                                    <p className="text-xs text-muted-foreground">Based on your recent browsing history</p>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={`/categories/${activeCategory.slug}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="group flex items-center gap-1.5 text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-primary transition-colors"
                                                >
                                                    All {activeCategory.name}
                                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            )}
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <div className="p-8">
                                                {loadingFeatured ? (
                                                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Personalizing</p>
                                                    </div>
                                                ) : activeCategory.id === FEATURED_CATEGORY_ID ? (
                                                    featuredCategories.length > 0 ? (
                                                        <div className="grid grid-cols-4 gap-x-10 gap-y-12">
                                                            {featuredCategories.map((sub) => (
                                                                <Link
                                                                    key={sub.id}
                                                                    href={`/categories/${sub.slug}`}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="group/item flex flex-col items-center text-center gap-3.5"
                                                                >
                                                                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-sm ring-4 ring-slate-50 dark:ring-slate-900 transition-all duration-300 group-hover/item:shadow-xl group-hover/item:scale-105 group-hover/item:ring-primary/10">
                                                                        {sub.image ? (
                                                                            <Image
                                                                                src={sub.image}
                                                                                alt={sub.name}
                                                                                fill
                                                                                className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                                                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1 px-2">
                                                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover/item:text-primary transition-colors line-clamp-2">
                                                                            {sub.name}
                                                                        </span>
                                                                        <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                                                                            Recently Viewed
                                                                        </span>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-5">
                                                                <Star className="h-8 w-8 text-yellow-500 opacity-30" />
                                                            </div>
                                                            <h4 className="text-base font-bold">Discover personalized picks</h4>
                                                            <p className="text-xs text-muted-foreground max-w-[200px] mt-2 leading-relaxed">
                                                                Your most visited categories will appear here for quick access.
                                                            </p>
                                                        </div>
                                                    )
                                                ) : activeCategory.children && activeCategory.children.length > 0 ? (
                                                    <div className="grid grid-cols-4 gap-x-10 gap-y-12">
                                                        {activeCategory.children.map((sub, index) => (
                                                            <Link
                                                                key={sub.id}
                                                                href={`/categories/${sub.slug}`}
                                                                onClick={() => setIsOpen(false)}
                                                                className="group/item flex flex-col items-center text-center gap-3.5 relative"
                                                            >
                                                                {(index === 0 || index === 4 || index === 5) && (
                                                                    <span className="absolute -top-1 right-2 z-20 bg-[#FF4D1C] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm scale-90">
                                                                        HOT
                                                                    </span>
                                                                )}
                                                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-sm ring-4 ring-slate-50 dark:ring-slate-900 transition-all duration-300 group-hover/item:shadow-xl group-hover/item:scale-105 group-hover/item:ring-primary/10">
                                                                    {sub.image ? (
                                                                        <Image
                                                                            src={sub.image}
                                                                            alt={sub.name}
                                                                            fill
                                                                            className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                                            <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors" />
                                                                </div>
                                                                <div className="px-2">
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-primary transition-colors line-clamp-2">
                                                                        {sub.name}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 text-center italic">
                                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-5 grayscale opacity-30">
                                                            <Package className="h-8 w-8" />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground font-medium">New arrivals in {activeCategory.name} coming soon!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                                        <Search className="h-10 w-10 mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Select a category to explore</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bottom Status Bar */}
                    <div className="bg-slate-50 dark:bg-slate-900/80 border-t px-8 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Fast Delivery</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                Secure Payment Gateway Verified
                            </p>
                        </div>
                        <Link href="/deals" className="text-xs font-extrabold text-primary hover:text-primary/80 flex items-center gap-1" onClick={() => setIsOpen(false)}>
                            FLASHSALE DEALS
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
