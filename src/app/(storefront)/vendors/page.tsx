"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Store,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";

interface Seller {
  id: string;
  businessName: string;
  slug: string;
  businessAddress: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  primaryCategory: string;
  productCount: number;
  sellerType: "VENDOR" | "ADS_SELLER";
  storeUrl: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function VendorsPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSellers();
  }, [selectedCategory]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/vendors?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSellers(data.data || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  const handleCategoryClick = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(catName);
    }
  };

  const filteredSellers = sellers.filter((seller) =>
    seller.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl space-y-8">
      {/* ── Top Circular Business Category Strip (Matches Image 3) ── */}
      <div className="relative border-b pb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Browse by Business Category
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter registered vendors and sellers by their trade sector
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Category Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-start gap-5 sm:gap-7 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth px-1"
        >
          {/* "All" circular button */}
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="flex flex-col items-center flex-shrink-0 group cursor-pointer transition-transform active:scale-95"
          >
            <div
              className={`w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-xs ${
                selectedCategory === "all"
                  ? "border-[#FF6600] ring-4 ring-[#FF6600]/20 bg-[#FF6600] text-white scale-105"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-primary group-hover:shadow-md text-slate-700 dark:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span
              className={`text-xs md:text-sm font-bold text-center mt-2.5 max-w-[85px] leading-tight transition-colors ${
                selectedCategory === "all"
                  ? "text-[#FF6600]"
                  : "text-slate-700 dark:text-slate-300 group-hover:text-primary"
              }`}
            >
              All Sellers
            </span>
          </button>

          {/* Categories with circular images */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className="flex flex-col items-center flex-shrink-0 group cursor-pointer transition-transform active:scale-95"
              >
                <div
                  className={`w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all duration-300 bg-white dark:bg-slate-900 shadow-xs ${
                    isSelected
                      ? "border-[#FF6600] ring-4 ring-[#FF6600]/25 scale-105 shadow-md"
                      : "border-slate-200 dark:border-slate-700 group-hover:border-primary group-hover:shadow-md"
                  }`}
                >
                  {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl">{cat.icon || "📁"}</span>
                  )}
                </div>
                <span
                  className={`text-xs md:text-sm font-bold text-center mt-2.5 max-w-[95px] line-clamp-2 leading-tight transition-colors ${
                    isSelected
                      ? "text-[#FF6600]"
                      : "text-slate-700 dark:text-slate-300 group-hover:text-primary"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Header: BROWSE VENDORS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 uppercase">
            BROWSE VENDORS
          </h1>
          <p className="text-muted-foreground font-medium text-base italic">
            Explore verified vendors, official brand stores, and classified ads sellers.
          </p>
        </div>

        {selectedCategory !== "all" && (
          <Badge
            variant="secondary"
            className="self-start sm:self-auto text-xs font-bold py-1.5 px-3 bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/30"
          >
            Category: {selectedCategory}
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="ml-2 hover:text-red-600 font-black cursor-pointer"
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Search by vendor or store name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-13 rounded-2xl border-2 transition-all focus:ring-0 focus:border-primary text-base font-bold shadow-xs bg-card"
          />
        </div>
      </div>

      {/* ── Vendors Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-3xl border-2">
              <Skeleton className="h-40 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-end -mt-12">
                  <Skeleton className="h-20 w-20 rounded-2xl border-4 border-white" />
                  <div className="space-y-2 flex-1 pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30 animate-pulse" />
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
            No Sellers Found
          </h3>
          <p className="text-muted-foreground font-medium max-w-md mx-auto italic text-sm">
            {searchQuery
              ? `We couldn't find any seller matching "${searchQuery}".`
              : selectedCategory !== "all"
              ? `No vendors or sellers found in "${selectedCategory}". Click "All Sellers" to view everyone.`
              : "Our marketplace is currently being curated. Check back soon for exciting new stores!"}
          </p>
          {(selectedCategory !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-5 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSellers.map((seller) => (
            <Link key={seller.id} href={seller.storeUrl} className="group">
              <Card className="overflow-hidden rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col bg-white dark:bg-slate-950">
                {/* Banner */}
                <div className="h-32 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  {seller.banner ? (
                    <Image
                      src={seller.banner}
                      alt={seller.businessName}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50/30 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                      <Store className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                  {/* Badges on Banner */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                    <Badge className="bg-white/95 text-black border-none font-black uppercase tracking-wider text-[10px] h-6 px-2.5 backdrop-blur-sm shadow-xs">
                      {seller.productCount} {seller.sellerType === "VENDOR" ? "Products" : "Ads"}
                    </Badge>
                  </div>

                  {seller.primaryCategory && (
                    <Badge className="absolute top-3.5 left-3.5 bg-black/70 text-white border-none text-[10px] font-bold h-6 px-2.5 backdrop-blur-sm">
                      {seller.primaryCategory}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
                  {/* Logo Overlay */}
                  <div className="flex gap-4 items-end -mt-10 mb-4 relative z-10">
                    <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-xl overflow-hidden relative flex-shrink-0">
                      {seller.logo ? (
                        <Image
                          src={seller.logo}
                          alt={seller.businessName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                          <Store className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="pb-1 min-w-0">
                      <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors truncate uppercase tracking-tight">
                        {seller.businessName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-primary mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                          {seller.sellerType === "VENDOR" ? "Verified Vendor" : "Verified Ads Seller"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3 flex-1">
                    {seller.description ? (
                      <p className="text-sm text-muted-foreground font-medium italic line-clamp-3 leading-relaxed">
                        "{seller.description}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 font-medium italic">
                        Experience quality products and exceptional service from {seller.businessName}.
                      </p>
                    )}
                  </div>

                  {/* Footer link */}
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 group-hover:text-primary transition-colors">
                      View Storefront
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transform transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
