"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
}

export interface FilterValues {
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
  inStock?: boolean;
  vendorId?: string;
}

interface ProductFiltersProps {
  categories: Category[];
  vendors?: Vendor[];
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export function ProductFilters({
  categories,
  vendors = [],
  onFilterChange,
  initialFilters = {},
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: FilterValues = {};
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const filterKeys: (keyof FilterValues)[] = ["categoryId", "minPrice", "maxPrice", "inStock", "vendorId"];
  const hasActiveFilters = filterKeys.some(
    (key) => filters[key] !== undefined && filters[key] !== "" && filters[key] !== false
  );

  return (
    <div className="flex items-center gap-4">
      {/* Sort Dropdown (always visible) */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-sm whitespace-nowrap hidden sm:block">
          Sort by:
        </Label>
        <Select
          value={filters.sortBy || "createdAt"}
          onValueChange={(value) => {
            const newFilters = { ...filters, sortBy: value };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        >
          <SelectTrigger className="w-[180px]" id="sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Button (Mobile Sheet) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your product search
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("categoryId", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Filter */}
            {vendors.length > 0 && (
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select
                  value={filters.vendorId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("vendorId", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range (Rs.)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={filters.inStock || false}
                onCheckedChange={(checked) =>
                  handleFilterChange("inStock", checked)
                }
              />
              <Label
                htmlFor="inStock"
                className="text-sm font-normal cursor-pointer"
              >
                In stock only
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
