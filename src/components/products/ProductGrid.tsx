import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

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
    id?: string;
    businessName: string;
    slug: string;
  };
}

interface ProductGridProps {
  products: Product[];
  columns?: number;
}

export function ProductGrid({ products, columns }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  // Calculate the grid class based on specified columns
  // Default responsive values: 2 columns on mobile, 3 on tablet, 4 on desktop
  let gridClass = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  if (columns === 1) gridClass = "grid-cols-1";
  if (columns === 2) gridClass = "grid-cols-2";
  if (columns === 3) gridClass = "grid-cols-2 sm:grid-cols-3";
  if (columns === 4) gridClass = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  if (columns === 5) gridClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5";

  return (
    <div className={`grid gap-6 ${gridClass}`}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className={cn(
            columns === 1 ? "md:max-w-xl mx-auto w-full" : "w-full",
            columns === 5 && products.length === 6 && index === 5 && "lg:hidden"
          )}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
