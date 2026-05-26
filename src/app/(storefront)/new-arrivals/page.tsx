"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  category?: { name: string; slug: string };
  vendor?: { businessName: string; slug: string };
}

function NewArrivalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", newPage.toString());
    router.push(`/new-arrivals${params.toString() ? `?${params}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">New Arrivals</h1>
        </div>
        <p className="text-muted-foreground">
          The latest products added to Try Me — freshest items first.
        </p>
        {!loading && (
          <Badge variant="secondary" className="w-fit">
            {pagination.total} {pagination.total === 1 ? "product" : "products"}
          </Badge>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <Sparkles className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm text-muted-foreground">
            Check back soon — new products are added regularly.
          </p>
        </div>
      ) : (
        <>
          <ProductGrid products={products} />
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function NewArrivalsPage() {
  return (
    <Suspense fallback={
      <div className="container px-4 md:px-6 py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    }>
      <NewArrivalsContent />
    </Suspense>
  );
}
