"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Globe, Building2, Layers, FolderTree, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendorOption {
  id: string;
  businessName: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface AdminOrderFilterBarProps {
  currentSource?: string;
  currentVendorId?: string;
  currentCategoryId?: string;
  currentSubCategoryId?: string;
  currentStatus?: string;
  vendors: VendorOption[];
  categories: CategoryOption[];
}

export function AdminOrderFilterBar({
  currentSource = "all",
  currentVendorId = "all",
  currentCategoryId = "all",
  currentSubCategoryId = "all",
  currentStatus,
  vendors = [],
  categories = [],
}: AdminOrderFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parent (top-level) categories
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  // Subcategories (filtered by selected parent if active)
  const availableSubCategories = useMemo(() => {
    if (currentCategoryId && currentCategoryId !== "all") {
      return categories.filter((c) => c.parentId === currentCategoryId);
    }
    return categories.filter((c) => Boolean(c.parentId));
  }, [categories, currentCategoryId]);

  const handleFilterChange = (updates: {
    source?: string;
    vendorId?: string;
    categoryId?: string;
    subCategoryId?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update source
    if (updates.source !== undefined) {
      if (updates.source === "all" || !updates.source) {
        params.delete("source");
      } else {
        params.set("source", updates.source);
      }
    }

    // Update vendorId
    if (updates.vendorId !== undefined) {
      if (updates.vendorId === "all" || !updates.vendorId) {
        params.delete("vendorId");
      } else {
        params.set("vendorId", updates.vendorId);
      }
    }

    // Update categoryId
    if (updates.categoryId !== undefined) {
      if (updates.categoryId === "all" || !updates.categoryId) {
        params.delete("categoryId");
      } else {
        params.set("categoryId", updates.categoryId);
      }
      // Reset subcategory when category changes unless explicitly passed
      if (updates.subCategoryId === undefined) {
        params.delete("subCategoryId");
      }
    }

    // Update subCategoryId
    if (updates.subCategoryId !== undefined) {
      if (updates.subCategoryId === "all" || !updates.subCategoryId) {
        params.delete("subCategoryId");
      } else {
        params.set("subCategoryId", updates.subCategoryId);
      }
    }

    // Reset page to 1 on filter changes
    params.delete("page");

    const query = params.toString();
    router.push(`/admin/orders${query ? `?${query}` : ""}`);
  };

  const handleResetFilters = () => {
    router.push("/admin/orders");
  };

  const isFiltered =
    (currentSource && currentSource !== "all") ||
    (currentVendorId && currentVendorId !== "all") ||
    (currentCategoryId && currentCategoryId !== "all") ||
    (currentSubCategoryId && currentSubCategoryId !== "all") ||
    Boolean(currentStatus);

  const selectedVendor = vendors.find((v) => v.id === currentVendorId);
  const selectedCategory = categories.find((c) => c.id === currentCategoryId);
  const selectedSubCategory = categories.find((c) => c.id === currentSubCategoryId);

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Channel / Source Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
            Order Channel / Source
          </label>
          <div className="inline-flex flex-wrap p-1 bg-muted rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleFilterChange({ source: "all" })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !currentSource || currentSource === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Orders
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange({ source: "tryme" })}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentSource === "tryme"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>TryMe.lk Orders</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange({ source: "website" })}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentSource === "website"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Vendor Websites (Direct)</span>
            </button>
          </div>
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="self-start sm:self-auto h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-dashed hover:border-solid"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset All Filters
          </Button>
        )}
      </div>

      {/* Dropdown Filters: Vendor, Category, Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
        {/* Vendor / Seller Dropdown */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Filter by Vendor / Seller</span>
          </label>
          <select
            value={currentVendorId || "all"}
            onChange={(e) => handleFilterChange({ vendorId: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-semibold focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="all">All Vendors &amp; Sellers</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName} ({v.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Shop Category Dropdown */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Shop Category</span>
          </label>
          <select
            value={currentCategoryId || "all"}
            onChange={(e) =>
              handleFilterChange({
                categoryId: e.target.value,
                subCategoryId: "all",
              })
            }
            className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-semibold focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="all">All Shop Categories</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Category Dropdown */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-primary" />
            <span>Sub Category</span>
          </label>
          <select
            value={currentSubCategoryId || "all"}
            onChange={(e) => handleFilterChange({ subCategoryId: e.target.value })}
            disabled={availableSubCategories.length === 0}
            className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-semibold focus:ring-2 focus:ring-primary shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="all">
              {availableSubCategories.length === 0
                ? "No Subcategories Available"
                : "All Sub Categories"}
            </option>
            {availableSubCategories.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Badges */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-muted-foreground mr-1">
            Active Filters:
          </span>
          {currentSource && currentSource !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              Source: {currentSource === "tryme" ? "TryMe.lk" : "Vendor Website"}
              <button
                type="button"
                onClick={() => handleFilterChange({ source: "all" })}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedVendor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              Vendor: {selectedVendor.businessName}
              <button
                type="button"
                onClick={() => handleFilterChange({ vendorId: "all" })}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
              Category: {selectedCategory.name}
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({ categoryId: "all", subCategoryId: "all" })
                }
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSubCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
              Subcategory: {selectedSubCategory.name}
              <button
                type="button"
                onClick={() => handleFilterChange({ subCategoryId: "all" })}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentStatus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
              Status: {currentStatus}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
