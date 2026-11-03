"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SidebarFilters } from "@/components/products/SidebarFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategoryCircleHierarchy,
  MainCategory,
} from "@/components/categories/CategoryCircleHierarchy";

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

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState<number>(4);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Read filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const rawCategoryId = searchParams.get("categoryId") || "";
  const categorySlug = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt-desc";
  const inStock = searchParams.get("inStock") === "true";

  const vendorIds = searchParams.getAll("vendorId");
  const sizes = searchParams.getAll("size");

  // Fetch categories and vendors
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [categoriesRes, vendorsRes] = await Promise.all([
          fetch("/api/categories?parentId=null"),
          fetch("/api/vendors"),
        ]);
        const categoriesData = await categoriesRes.json();
        const vendorsData = await vendorsRes.json();

        if (categoriesData.success && Array.isArray(categoriesData.data?.categories)) {
          const treeCategories: MainCategory[] = categoriesData.data.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            parentId: cat.parentId,
            children: (cat.children || []).map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              slug: ch.slug,
              description: ch.description,
              image: ch.image,
              parentId: ch.parentId,
            })),
          }));
          setCategories(treeCategories);
        }

        if (vendorsData.success && Array.isArray(vendorsData.data)) {
          setVendors(
            vendorsData.data.map((v: any) => ({
              id: v.id,
              businessName: v.businessName,
              slug: v.slug,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchFiltersData();
  }, []);

  // Resolve category ID from slug if categoryId wasn't passed directly
  const categoryId = useMemo(() => {
    if (rawCategoryId) return rawCategoryId;
    if (!categorySlug || categories.length === 0) return "";
    for (const cat of categories) {
      if (cat.slug === categorySlug) return cat.id;
      const child = cat.children?.find((ch) => ch.slug === categorySlug);
      if (child) return child.id;
    }
    return "";
  }, [rawCategoryId, categorySlug, categories]);

  // Determine active category title
  const activeTitle = useMemo(() => {
    if (!categoryId) return "Shop by Category";
    for (const cat of categories) {
      if (cat.id === categoryId) return cat.name;
      const child = cat.children?.find((ch) => ch.id === categoryId);
      if (child) return `${cat.name} / ${child.name}`;
    }
    return "Shop by Category";
  }, [categoryId, categories]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(!categoryId && categorySlug && { category: categorySlug }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sortBy && { sortBy }),
          ...(inStock && { inStock: "true" }),
        });

        // Append array params
        vendorIds.forEach((id) => params.append("vendorId", id));
        sizes.forEach((size) => params.append("size", size));

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, search, categoryId, categorySlug, minPrice, maxPrice, sortBy, inStock, vendorIds.join(","), sizes.join(",")]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (query: string) => {
    updateURL({ search: query });
  };

  const handleCategorySelect = (selectedId: string) => {
    updateURL({ categoryId: selectedId, category: "" });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container px-4 md:px-6 py-6 sm:py-8">
      {/* Header, Search & Category Circle Hierarchy */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              {activeTitle}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Browse our curated collection of styles, collections and essentials.
            </p>
          </div>
          <div className="w-full max-w-md">
            <SearchBar onSearch={handleSearch} defaultValue={search} />
          </div>
        </div>

        {/* 2-Tier Circular Category Filter (Main + Subcategories) */}
        <CategoryCircleHierarchy
          categories={categories}
          selectedCategoryId={categoryId}
          onSelectCategory={handleCategorySelect}
        />

        {/* Sort and Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-end border-t border-b py-3 mb-2">
          <ProductSort
            value={sortBy}
            onValueChange={(val) => updateURL({ sortBy: val })}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[280px] shrink-0">
          <SidebarFilters
            categories={categories}
            vendors={vendors}
            activeCategoryId={categoryId}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-xl font-semibold uppercase tracking-wide">
              {activeTitle === "Shop by Category" ? "All Products" : activeTitle}
            </h2>
            <div className="text-sm text-muted-foreground flex items-center gap-6">
              <span className="font-medium text-[#777]">
                {loading ? (
                  <Skeleton className="h-4 w-20 inline-block" />
                ) : (
                  `${pagination.total} products`
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#333] font-semibold uppercase text-xs tracking-widest hidden sm:inline-block">
                  View As
                </span>
                <div className="flex items-center gap-1.5">
                  {/* 1 Col */}
                  <button
                    onClick={() => setViewAs(1)}
                    className={`p-1 flex border transition-colors ${
                      viewAs === 1
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label="1 product per row"
                  >
                    <div
                      className={`w-4 h-4 ${
                        viewAs === 1 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                  </button>
                  {/* 2 Cols */}
                  <button
                    onClick={() => setViewAs(2)}
                    className={`p-1 flex gap-[2px] border transition-colors ${
                      viewAs === 2
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label="2 products per row"
                  >
                    <div
                      className={`w-2 h-4 ${
                        viewAs === 2 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-4 ${
                        viewAs === 2 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                  </button>
                  {/* 3 Cols */}
                  <button
                    onClick={() => setViewAs(3)}
                    className={`p-1 hidden sm:flex gap-[2px] border transition-colors ${
                      viewAs === 3
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label="3 products per row"
                  >
                    <div
                      className={`w-1 h-4 ${
                        viewAs === 3 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-1 h-4 ${
                        viewAs === 3 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-1 h-4 ${
                        viewAs === 3 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                  </button>
                  {/* 4 Cols */}
                  <button
                    onClick={() => setViewAs(4)}
                    className={`p-1 hidden md:flex gap-[2px] border transition-colors ${
                      viewAs === 4
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label="4 products per row"
                  >
                    <div
                      className={`w-[3px] h-4 ${
                        viewAs === 4 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[3px] h-4 ${
                        viewAs === 4 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[3px] h-4 ${
                        viewAs === 4 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[3px] h-4 ${
                        viewAs === 4 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                  </button>
                  {/* 5 Cols */}
                  <button
                    onClick={() => setViewAs(5)}
                    className={`p-1 hidden lg:flex gap-[2px] border transition-colors ${
                      viewAs === 5
                        ? "border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label="5 products per row"
                  >
                    <div
                      className={`w-[2px] h-4 ${
                        viewAs === 5 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[2px] h-4 ${
                        viewAs === 5 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[2px] h-4 ${
                        viewAs === 5 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[2px] h-4 ${
                        viewAs === 5 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`w-[2px] h-4 ${
                        viewAs === 5 ? "bg-primary" : "bg-gray-300"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full bg-gray-100" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} columns={viewAs} />
          ) : (
            <div className="py-20 text-center text-gray-500 font-medium">
              No products found matching your active filters. Try clearing some constraints.
            </div>
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

function ProductsPageSkeleton() {
  return (
    <div className="container px-4 md:px-6 py-8">
      <Skeleton className="h-[100px] w-full mb-8" />
      <div className="flex flex-col lg:flex-row gap-8">
        <Skeleton className="hidden lg:block w-[280px] h-[600px]" />
        <div className="flex-1">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}
