"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Globe, Building2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendorOption {
  id: string;
  businessName: string;
  slug: string;
}

interface AdminOrderFilterBarProps {
  currentSource?: string;
  currentVendorId?: string;
  currentStatus?: string;
  vendors: VendorOption[];
}

export function AdminOrderFilterBar({
  currentSource = "all",
  currentVendorId = "all",
  currentStatus,
  vendors = [],
}: AdminOrderFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (updates: { source?: string; vendorId?: string; status?: string }) => {
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
    Boolean(currentStatus);

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Channel / Source Tabs */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
            Order Channel / Source
          </label>
          <div className="inline-flex p-1 bg-muted rounded-xl gap-1">
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

        {/* Vendor / Ads Seller Dropdown Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="min-w-[240px]">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Filter by Vendor / Seller</span>
            </label>
            <select
              value={currentVendorId || "all"}
              onChange={(e) => handleFilterChange({ vendorId: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-bold focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="all">All Vendors &amp; Sellers</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} ({v.slug})
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

