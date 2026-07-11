"use client";

import { useState } from "react";
import { Edit, Trash, MoreHorizontal, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { VendorProductListItem } from "@/types/product";

interface ProductTableProps {
  products: VendorProductListItem[];
  onProductUpdated: () => void;
}

export function ProductTable({
  products,
  onProductUpdated,
}: ProductTableProps) {
  const [deletingProduct, setDeletingProduct] =
    useState<VendorProductListItem | null>(null);
  const [viewingVariantsProduct, setViewingVariantsProduct] =
    useState<VendorProductListItem | null>(null);
  const { toast } = useToast();

  const handleToggleStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update product status",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Product ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      onProductUpdated();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const response = await fetch(
        `/api/vendor/products/${deletingProduct.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete product",
        });
        setDeletingProduct(null);
        return;
      }

      toast({
        title: "Success",
        description: "Product deactivated successfully",
      });

      setDeletingProduct(null);
      onProductUpdated();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const formatPrice = (price: number | string) => {
    return `Rs. ${Number(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPriceDisplay = (product: any) => {
    const basePrice = Number(product.price);
    if (!product.variants || product.variants.length === 0) {
      return formatPrice(basePrice);
    }
    const effectivePrices = product.variants.map((v: any) => basePrice + Number(v.priceAdjustment || 0));
    const minPrice = Math.min(...effectivePrices);
    const maxPrice = Math.max(...effectivePrices);
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No products found</p>
          <p className="text-sm text-muted-foreground">
            Create your first product to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.images[0] ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        No image
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    )}
                    {product._count?.variants && product._count.variants > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {product._count.variants} variant
                        {product._count.variants > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.category.name}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{getPriceDisplay(product)}</p>
                    {product.compareAtPrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(Number(product.compareAtPrice))}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product._count?.variants && product._count.variants > 0 ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-xs text-primary underline decoration-dotted hover:decoration-solid hover:text-primary/80 transition-colors"
                        onClick={() => setViewingVariantsProduct(product)}
                      >
                        By variant ({product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0})
                      </Button>
                    ) : (
                      <>
                        <span className="text-sm">{product.stock}</span>
                        {product.lowStockAlert && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Low
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {product.isDisabledByAdmin ? (
                      <Badge variant="destructive">Disabled by Admin</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() =>
                            handleToggleStatus(product.id, product.isActive)
                          }
                          disabled={product.isDisabledByAdmin}
                        />
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/products/${product.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingProduct(product)}
                        className="text-destructive"
                        disabled={product.isDisabledByAdmin}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &ldquo;{deletingProduct?.name}&rdquo;? This
              will hide it from the storefront, but you can reactivate it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Stock Dialog */}
      <Dialog
        open={!!viewingVariantsProduct}
        onOpenChange={(open) => !open && setViewingVariantsProduct(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Variant Stock Details</DialogTitle>
            <DialogDescription>
              Stock breakdown for &ldquo;{viewingVariantsProduct?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewingVariantsProduct?.variants &&
                viewingVariantsProduct.variants.length > 0 ? (
                  viewingVariantsProduct.variants.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">
                        {v.name}: {v.value}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {v.sku || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPrice(Number(viewingVariantsProduct.price) + Number(v.priceAdjustment || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            v.stock <= 5
                              ? "text-destructive font-semibold text-sm"
                              : "text-sm"
                          }
                        >
                          {v.stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-4 text-sm"
                    >
                      No variants found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingVariantsProduct(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
