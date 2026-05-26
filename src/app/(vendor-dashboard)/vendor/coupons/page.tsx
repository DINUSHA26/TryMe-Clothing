/**
 * Vendor Coupons Management Page
 * Vendors can create and manage their own coupons
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
import { Plus, Search, Loader2, Ticket, Info } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createCouponSchema } from "@/lib/validations/coupon";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CouponFormData = z.infer<typeof createCouponSchema>;

interface CouponWithCount extends Coupon {
  _count: {
    orders: number;
    usages: number;
  };
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
  };
}

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<CouponWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithCount | null>(
    null
  );

  useEffect(() => {
    fetchCoupons();
  }, [search, typeFilter, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);

      const response = await fetch(`/api/vendor/coupons?${params.toString()}`);
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
      const response = await fetch("/api/vendor/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      const response = await fetch(`/api/vendor/coupons/${selectedCoupon.id}`, {
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
      const response = await fetch(`/api/vendor/coupons/${selectedCoupon.id}`, {
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
          <h1 className="text-3xl font-bold">My Coupons</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage discount coupons for your products
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your coupons are vendor-specific and can only be used on orders
          containing your products. Customers can apply your coupons during
          checkout.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              : "Create your first coupon to attract more customers"}
          </p>
          {!search && typeFilter === "all" && statusFilter === "all" && (
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
