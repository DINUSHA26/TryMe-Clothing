/**
 * Admin Coupons Management Page
 * List, create, edit, and delete coupons
 */

"use client";

import { useState, useEffect } from "react";
import { Coupon, CouponType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CouponCard } from "@/components/coupons/CouponCard";
import { CouponForm } from "@/components/coupons/CouponForm";
import { DeleteCouponDialog } from "@/components/coupons/DeleteCouponDialog";
import { Plus, Search, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createCouponSchema } from "@/lib/validations/coupon";

type CouponFormData = z.infer<typeof createCouponSchema>;

interface CouponWithCount extends Coupon {
  _count: {
    orders: number;
    usages: number;
  };
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
  } | null;
}

interface CouponsResponse {
  coupons: CouponWithCount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    platformWide: number;
    vendorSpecific: number;
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    platformWide: 0,
    vendorSpecific: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithCount | null>(
    null
  );

  // Vendors for dropdown
  const [vendors, setVendors] = useState<
    { id: string; businessName: string }[]
  >([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [search, typeFilter, statusFilter, vendorFilter]);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/admin/vendors");
      const data = await response.json();

      if (data.success) {
        setVendors(
          data.data.vendors.map((v: any) => ({
            id: v.id,
            businessName: v.businessName,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);
      if (vendorFilter !== "all") params.append("vendorId", vendorFilter);

      const response = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data.coupons);
        setStats(data.data.stats);
      } else {
        toast.error(data.error || "Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (data: CouponFormData) => {
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          vendorId: data.vendorId === "null" ? null : data.vendorId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Coupon created successfully");
        setCreateDialogOpen(false);
        fetchCoupons();
      } else {
        toast.error(result.error || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Failed to create coupon");
    }
  };

  const handleUpdateCoupon = async (data: CouponFormData) => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Coupon updated successfully");
        setEditDialogOpen(false);
        setSelectedCoupon(null);
        fetchCoupons();
      } else {
        toast.error(result.error || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Coupon deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedCoupon(null);
        fetchCoupons();
      } else {
        toast.error(result.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground mt-2">
            Manage platform-wide and vendor-specific discount coupons
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Coupons</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">
            {stats.inactive}
          </div>
          <div className="text-sm text-muted-foreground">Inactive</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {stats.platformWide}
          </div>
          <div className="text-sm text-muted-foreground">Platform-wide</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {stats.vendorSpecific}
          </div>
          <div className="text-sm text-muted-foreground">Vendor-specific</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={CouponType.PERCENTAGE}>Percentage</SelectItem>
            <SelectItem value={CouponType.FLAT}>Flat Amount</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            <SelectItem value="platform">Platform-wide</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
          <p className="text-muted-foreground mb-4">
            {search || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first coupon to get started"}
          </p>
          {!search &&
            typeFilter === "all" &&
            statusFilter === "all" &&
            vendorFilter === "all" && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              showVendor
              onEdit={() => {
                setSelectedCoupon(coupon);
                setEditDialogOpen(true);
              }}
              onDelete={() => {
                setSelectedCoupon(coupon);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new coupon code.
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            onSubmit={handleCreateCoupon}
            onCancel={() => setCreateDialogOpen(false)}
            showVendorSelect
            vendors={vendors}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details below.
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <CouponForm
              coupon={selectedCoupon}
              onSubmit={handleUpdateCoupon}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedCoupon(null);
              }}
              showVendorSelect
              vendors={vendors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Dialog */}
      {selectedCoupon && (
        <DeleteCouponDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteCoupon}
          couponCode={selectedCoupon.code}
        />
      )}
    </div>
  );
}
