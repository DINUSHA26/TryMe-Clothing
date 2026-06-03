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
import { ChevronRight, Home, Package } from "lucide-react";
import { toast } from "sonner";
import { SubCategoryBar } from "@/components/categories/SubCategoryBar";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  }[];
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

function CategoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [viewAs, setViewAs] = useState<number>(4);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [parentCategory, setParentCategory] = useState<any | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";

  // Fetch category details
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, vendorsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/vendors")
        ]);
        const data = await categoriesRes.json();
        const vendorsData = await vendorsRes.json();

        if (vendorsData.success && Array.isArray(vendorsData.data)) {
          setVendors(vendorsData.data);
        }

        if (data.success && Array.isArray(data.data?.categories)) {
          const cats = data.data.categories;

          // Rebuild trees for SidebarFilters
          const treeCategories = cats.filter((c: any) => !c.parentId).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            children: c.children || []
          }));
          setAllCategories(treeCategories);

          // Find current category recursively
          let foundCategory: any = null;
          let parent: any = null;

          function findCategory(list: any[], targetSlug: string, currentParent: any = null) {
            for (const cat of list) {
              if (cat.slug === targetSlug) {
                foundCategory = cat;
                parent = currentParent;
                return true;
              }
              if (cat.children && cat.children.length > 0) {
                if (findCategory(cat.children, targetSlug, cat)) return true;
              }
            }
            return false;
          }

          findCategory(cats, slug);

          if (foundCategory) {
            setCategory({
              ...foundCategory,
              parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : undefined
            });
            setParentCategory(parent);

            // Determine what to show in SubCategoryBar
            if (parent) {
              // On a subcategory: show siblings
              setSubCategories(parent.children || []);
            } else {
              // On a root category: show children
              setSubCategories(foundCategory.children || []);
            }
          } else {
            toast.error("Category not found");
          }
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        toast.error("Failed to load category");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  // Fetch products in this category
  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          categoryId: category.id,
          ...(search && { search }),
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
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [category, page, search, minPrice, maxPrice, sortBy, inStock]);

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

    router.push(`/categories/${slug}?${params.toString()}`);
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

  if (!category && !loading) {
    return (
      <div className="container px-4 md:px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 pt-12 pb-16">
      {/* breadcrumbs at top */}
      {category && (
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
          <Link href="/products" className="hover:text-primary transition-colors">
            Categories
          </Link>
          {category.parent && (
            <>
              <ChevronRight className="h-2.5 w-2.5 opacity-50" />
              <Link
                href={`/categories/${category.parent.slug}`}
                className="hover:text-primary transition-colors"
              >
                {category.parent.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
          <span className="text-primary">{category.name}</span>
        </nav>
      )}

      {/* Dynamic Sub-category Bar */}
      {subCategories.length > 0 && (
        <div className="mb-8">
          <SubCategoryBar
            categories={subCategories}
            activeSlug={slug}
            parentSlug={parentCategory?.slug}
          />
        </div>
      )}

      {/* Filters and Count Bar - Clean Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-y mb-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-[64px] z-10 px-4 -mx-4 sm:mx-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
            {category?.name}
          </h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <span className="text-primary font-black">{pagination.total}</span>
            )} Collections Found
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
          <SidebarFilters categories={allCategories} vendors={vendors} activeCategoryId={category?.id} basePath="/products" />
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {/* Products Grid */}
          {loadingProducts ? (
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

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="container px-4 md:px-6 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading category...</p>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
