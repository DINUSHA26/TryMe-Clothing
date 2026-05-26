"use client";

import { ProductForm } from "@/components/vendor/products/ProductForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
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
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground mt-1">
          Add a new product to your catalog
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
