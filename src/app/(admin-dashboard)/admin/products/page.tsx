"use client";

import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/products/ProductTable";
import type { AdminProductListItem } from "@/types/product";

interface ProductListResponse {
  products: AdminProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminDisabledFilter, setAdminDisabledFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { isActive: statusFilter }),
        ...(adminDisabledFilter !== "all" && {
          isDisabledByAdmin: adminDisabledFilter,
        }),
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        ...(vendorFilter !== "all" && { vendorId: vendorFilter }),
      });

      const response = await fetch(`/api/admin/products?${params}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch products",
        });
        return;
      }

      setProducts(result.data.products);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const result = await response.json();

      if (result.success) {
        // Flatten categories but keep track of depth for indentation
        const flattened: any[] = [];
        result.data.categories.forEach((cat: any) => {
          flattened.push({ ...cat, depth: 0 });
          if (cat.children) {
            cat.children.forEach((child: any) => {
              flattened.push({ ...child, depth: 1 });
            });
          }
        });
        setCategories(flattened);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/admin/vendors?pageSize=100");
      const result = await response.json();

      if (result.success) {
        setVendors(result.data.vendors || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    pagination.page,
    searchQuery,
    statusFilter,
    adminDisabledFilter,
    categoryFilter,
    vendorFilter,
  ]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination({ ...pagination, page: 1 });
  };

  // Calculate stats
  const totalProducts = pagination.totalCount;
  const activeProducts = products.filter(
    (p) => p.isActive && !p.isDisabledByAdmin
  ).length;
  const disabledByAdmin = products.filter((p) => p.isDisabledByAdmin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all vendor products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold mt-1">{totalProducts}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Active Products</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {activeProducts}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Disabled by Admin</p>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {disabledByAdmin}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
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

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.depth > 0 ? "\u00A0\u00A0\u00A0" : ""}
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={adminDisabledFilter}
          onValueChange={setAdminDisabledFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Admin Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Privacy</SelectItem>
            <SelectItem value="false">Visible</SelectItem>
            <SelectItem value="true">Hidden (Admin)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ProductTable products={products} onProductUpdated={fetchProducts} />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.totalCount
            )}{" "}
            of {pagination.totalCount} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
