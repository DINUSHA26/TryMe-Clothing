"use client";

import { useState, useEffect, use } from "react";
import { ProductForm } from "@/components/vendor/products/ProductForm";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ProductFormData } from "@/types/product";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<
    (Partial<ProductFormData> & { id: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/vendor/products/${resolvedParams.id}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load product",
        });
        return;
      }

      // Transform product data for form
      const productData = result.data.product;
      setProduct({
        id: productData.id,
        categoryId: productData.categoryId,
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        compareAtPrice: productData.compareAtPrice
          ? Number(productData.compareAtPrice)
          : undefined,
        sku: productData.sku || "",
        stock: productData.stock,
        lowStockThreshold: productData.lowStockThreshold,
        images: productData.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          position: img.position,
        })),
        variants: productData.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          value: v.value,
          priceAdjustment: v.priceAdjustment ? Number(v.priceAdjustment) : 0,
          stock: v.stock,
          sku: v.sku || "",
        })),
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/vendor/products">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/products">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">
          Update product information and settings
        </p>
      </div>

      <ProductForm mode="edit" initialData={product} />
    </div>
  );
}
