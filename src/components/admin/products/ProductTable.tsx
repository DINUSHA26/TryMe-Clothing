"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, ShieldOff, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DisableProductDialog } from "./DisableProductDialog";
import type { AdminProductListItem } from "@/types/product";

interface ProductTableProps {
  products: AdminProductListItem[];
  onProductUpdated: () => void;
}

export function ProductTable({
  products,
  onProductUpdated,
}: ProductTableProps) {
  const [disablingProduct, setDisablingProduct] =
    useState<AdminProductListItem | null>(null);
  const [viewingVariantsProduct, setViewingVariantsProduct] =
    useState<AdminProductListItem | null>(null);

  const formatPrice = (price: number | string) => {
    return `Rs. ${Number(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No products found</p>
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
              <TableHead>Vendor</TableHead>
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
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.vendor.businessName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.category.name}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatPrice(Number(product.price))}</p>
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
                        {product.stock <= (product.lowStockThreshold || 5) && (
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
                  <div className="flex flex-col gap-1">
                    {product.isDisabledByAdmin ? (
                      <Badge variant="destructive">Disabled by Admin</Badge>
                    ) : product.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
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
                      {product.isDisabledByAdmin ? (
                        <DropdownMenuItem
                          onClick={() => setDisablingProduct(product)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Enable Product
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setDisablingProduct(product)}
                          className="text-destructive"
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Disable Product
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Disable/Enable Dialog */}
      {disablingProduct && (
        <DisableProductDialog
          product={disablingProduct}
          open={!!disablingProduct}
          onOpenChange={(open) => !open && setDisablingProduct(null)}
          onSuccess={onProductUpdated}
        />
      )}

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
