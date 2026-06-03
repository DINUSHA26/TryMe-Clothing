"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SidebarFilters } from "@/components/products/SidebarFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, Store, Package, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  shopOpen: boolean;
  productCount: number;
  followerCount?: number;
  totalSells?: number;
  rating?: number;
  isFollowing?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  category?: {
    name: string;
    slug: string;
  };
  vendor?: {
    businessName: string;
    slug: string;
  };
}

function VendorStorePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState<number>(4);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const { isAuthenticated } = useAuthStore();
  const [followingLoading, setFollowingLoading] = useState(false);

  const formatSells = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + "M+";
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + "K+";
    if (count >= 100) return Math.floor(count / 100) * 100 + "+";
    if (count >= 10) return Math.floor(count / 10) * 10 + "+";
    return count.toString();
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please register or login first to follow this shop.");
      router.push(`/login?returnUrl=/vendors/${slug}`);
      return;
    }
    
    setFollowingLoading(true);
    try {
      const response = await fetch(`/api/vendors/${slug}/follow`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setVendor(prev => {
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

  const handleShopAllItems = () => {
    router.push(`/vendors/${slug}`);
  };

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";

  // Fetch vendor details
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/vendors/${slug}`);
        const data = await response.json();

        if (data.success) {
          setVendor(data.data.vendor);
        } else {
          toast.error("Vendor not found");
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
        toast.error("Failed to load vendor");
      }
    };

    fetchVendor();
  }, [slug]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.categories)) {
          const cats = data.data.categories;
          const treeCategories = cats.filter((c: any) => !c.parentId).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            children: c.children || []
          }));
          setAllCategories(treeCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch vendor products
  useEffect(() => {
    if (!vendor) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          vendorId: vendor.id,
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sortBy && { sortBy }),
          ...(inStock && { inStock: "true" }),
        });

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendor, page, search, categoryId, minPrice, maxPrice, sortBy, inStock]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/vendors/${slug}?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    updateURL({ search: query });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateURL({ [key]: value });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!vendor && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      {vendor && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{vendor.businessName}</span>
        </nav>
      )}

      {/* Vendor Header - Immersive Design */}
      {vendor && (
        <div className="mb-12">
          <Card className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-950">
            {/* Banner */}
            <div className="relative h-64 sm:h-80 bg-slate-100 dark:bg-slate-900 overflow-hidden">
              {vendor.banner ? (
                <Image
                  src={vendor.banner}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                  <Store className="h-16 w-16 text-muted-foreground/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Vendor Profle Section */}
            <div className="px-8 pb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 relative z-10 text-center sm:text-left">
                {/* Logo with Ring */}
                <div className="h-32 w-32 sm:h-44 sm:w-44 rounded-[2rem] border-8 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative flex-shrink-0">
                  {vendor.logo ? (
                    <Image src={vendor.logo} alt={vendor.businessName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/10">
                      <Store className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="pb-2 space-y-3 flex-1">
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-2">
                      {vendor.businessName}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Badge className="bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] h-7 px-3 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Official Store
                      </Badge>
                      <Badge variant="outline" className="border-2 font-black uppercase tracking-widest text-[10px] h-7 px-3">
                        {vendor.productCount} CURATED ITEMS
                      </Badge>
                      {!vendor.shopOpen && (
                        <Badge variant="destructive" className="font-black uppercase tracking-widest text-[10px] h-7 px-3">
                          Temporarily Closed
                        </Badge>
                      )}
                    </div>

                    {/* Stats bar: Followers | Sold | Rating */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-600 dark:text-slate-300 text-sm font-semibold mt-3">
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{vendor.followerCount || 0}</strong> Followers
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{formatSells(vendor.totalSells || 0)}</strong> Sold
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{(vendor.rating || 0).toFixed(1)}</strong>
                        <Star className="w-4.5 h-4.5 fill-yellow-500 text-yellow-500 inline" />
                      </span>
                    </div>

                    {/* Buttons: Follow and Shop all items */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followingLoading}
                        className={`h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 border-2 ${
                          vendor.isFollowing
                            ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                            : "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white hover:bg-slate-800 dark:hover:bg-slate-100"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        {vendor.isFollowing ? "Following" : "Follow"}
                      </button>

                      <button
                        onClick={handleShopAllItems}
                        className="h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        Shop all items ({vendor.productCount})
                      </button>
                    </div>
                  </div>

                  {vendor.description && (
                    <p className="max-w-2xl text-muted-foreground font-medium italic text-lg leading-relaxed pt-2">
                      "{vendor.description}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6" id="vendor-products-section">
        <SearchBar
          onSearch={handleSearch}
          defaultValue={search}
          placeholder={`Search in ${vendor?.businessName || "store"}...`}
        />
      </div>

      {/* Filters and Count Bar - Clean Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-y mb-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-[64px] z-10 px-4 -mx-4 sm:mx-0">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <span className="text-primary font-black">{pagination.total}</span>
            )} Products Found
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ProductSort
            value={sortBy}
            onValueChange={(val) => updateURL({ sortBy: val })}
          />
          <div className="flex items-center gap-2">
            <span className="text-[#333] font-semibold uppercase text-xs tracking-widest hidden sm:inline-block">View As</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setViewAs(1)} className={`p-1 flex border transition-colors ${viewAs === 1 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-4 h-4 ${viewAs === 1 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
              <button onClick={() => setViewAs(2)} className={`p-1 flex gap-[2px] border transition-colors ${viewAs === 2 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-2 h-4 ${viewAs === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-2 h-4 ${viewAs === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
              <button onClick={() => setViewAs(3)} className={`p-1 hidden sm:flex gap-[2px] border transition-colors ${viewAs === 3 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
              <button onClick={() => setViewAs(4)} className={`p-1 hidden md:flex gap-[2px] border transition-colors ${viewAs === 4 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
              <button onClick={() => setViewAs(5)} className={`p-1 hidden lg:flex gap-[2px] border transition-colors ${viewAs === 5 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[280px] shrink-0">
          <SidebarFilters basePath={`/vendors/${slug}`} categories={allCategories} vendors={[]} activeCategoryId={categoryId} />
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={products} columns={viewAs} />
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-16 py-8 border-t">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorStorePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading vendor store...</p>
      </div>
    }>
      <VendorStorePageContent />
    </Suspense>
  );
}
