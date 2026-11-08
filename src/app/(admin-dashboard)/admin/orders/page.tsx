/**
 * Admin Orders Page
 * Lists all orders with advanced filtering and statistics
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { getAdminOrders as getAdminOrdersDirect } from "@/lib/services/admin-order-service";
import { headers } from "next/headers";
import { AdminOrdersTable } from "@/components/admin/orders/AdminOrdersTable";
import { AdminOrderFilterBar } from "@/components/admin/orders/AdminOrderFilterBar";
import { Store, Globe, DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@prisma/client";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
  source?: "all" | "tryme" | "website";
  vendorId?: string;
  categoryId?: string;
  subCategoryId?: string;
}
async function getAdminOrders(searchParams: SearchParams) {
  const headersList = await headers();
  const xUserRole = headersList.get("X-User-Role");

  // Allow if we have an admin role from middleware
  if (xUserRole && xUserRole !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }

  try {
    const data = await getAdminOrdersDirect({
      page: searchParams.page,
      status: searchParams.status,
      source: searchParams.source,
      vendorId: searchParams.vendorId,
      categoryId: searchParams.categoryId,
      subCategoryId: searchParams.subCategoryId,
      pageSize: "20",
    });
    return data;
  } catch (error: any) {
    console.error("[AdminOrdersPage] Error:", error);
    return { error: error.message || "Failed to fetch orders" };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const result = await getAdminOrders(resolvedSearchParams);

  if (!result) {
    redirect("/staff/login");
  }

  if ("error" in result) {
    if (result.status === 401) {
      redirect("/staff/login");
    }

    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-muted-foreground mb-8">{result.error}</p>
        <Link href="/admin">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { orders, pagination, stats, vendorsList = [], categoriesList = [] } = result;
  const currentStatus = resolvedSearchParams.status;
  const currentSource = resolvedSearchParams.source || "all";
  const currentVendorId = resolvedSearchParams.vendorId || "all";
  const currentCategoryId = resolvedSearchParams.categoryId || "all";
  const currentSubCategoryId = resolvedSearchParams.subCategoryId || "all";

  // Helper to construct filter query URLs
  const buildFilterUrl = (overrides: { status?: string | null; page?: number }) => {
    const p = new URLSearchParams();
    const st = overrides.status !== undefined ? overrides.status : currentStatus;
    if (st) p.set("status", st);
    if (currentSource && currentSource !== "all") p.set("source", currentSource);
    if (currentVendorId && currentVendorId !== "all") p.set("vendorId", currentVendorId);
    if (currentCategoryId && currentCategoryId !== "all") p.set("categoryId", currentCategoryId);
    if (currentSubCategoryId && currentSubCategoryId !== "all") p.set("subCategoryId", currentSubCategoryId);
    if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
    const qs = p.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">All Orders</h1>
        <p className="text-muted-foreground">
          Manage and monitor all platform orders
        </p>
      </div>

      {/* Detailed Revenue & Order Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TryMe Marketplace Sales */}
        <div className="border-2 border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>TryMe Sales</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              {stats.trymeOrdersCount ?? 0} Orders
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
            Rs. {(stats.trymeRevenue || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <div className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Platform Fee Earned:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              Rs. {(stats.trymeCommission || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Vendor Websites Direct Sales */}
        <div className="border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Websites Direct</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              {stats.websiteOrdersCount ?? 0} Orders
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
            Rs. {(stats.websiteRevenue || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <div className="pt-1.5 border-t border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Platform Commission:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              0% (Direct Seller)
            </span>
          </div>
        </div>

        {/* Total Platform Volume */}
        <div className="border rounded-2xl p-4 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Gross Volume (GMV)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Total: {stats.total}
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">
            Rs. {(stats.totalRevenue || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1.5 border-t">
            Combined TryMe Marketplace &amp; Website sales
          </p>
        </div>

        {/* Fulfillment Pipeline */}
        <div className="border rounded-2xl p-4 bg-card shadow-xs space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Fulfillment Status</span>
          </span>
          <div className="flex items-center gap-4 pt-1">
            <div>
              <p className="text-xs text-muted-foreground">Processing</p>
              <p className="text-xl font-black text-amber-600">{stats.processing}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Shipped</p>
              <p className="text-xl font-black text-blue-600">{stats.shipped}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-black text-emerald-600">{stats.deliveryConfirmed}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1.5 border-t">
            Active orders progressing through delivery
          </p>
        </div>
      </div>

      {/* Channel & Vendor & Category Filter Bar */}
      <AdminOrderFilterBar
        currentSource={currentSource}
        currentVendorId={currentVendorId}
        currentCategoryId={currentCategoryId}
        currentSubCategoryId={currentSubCategoryId}
        currentStatus={currentStatus}
        vendors={vendorsList}
        categories={categoriesList}
      />

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href={buildFilterUrl({ status: null, page: 1 })}>
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Statuses
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "PENDING_PAYMENT", page: 1 })}>
          <Button variant={currentStatus === "PENDING_PAYMENT" ? "default" : "outline"} size="sm">
            Pending Payment
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "PENDING_VERIFICATION", page: 1 })}>
          <Button variant={currentStatus === "PENDING_VERIFICATION" ? "default" : "outline"} size="sm">
            Pending Verification
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "PAYMENT_CONFIRMED", page: 1 })}>
          <Button variant={currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"} size="sm">
            Payment Confirmed
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "PROCESSING", page: 1 })}>
          <Button variant={currentStatus === "PROCESSING" ? "default" : "outline"} size="sm">
            Processing
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "SHIPPED", page: 1 })}>
          <Button variant={currentStatus === "SHIPPED" ? "default" : "outline"} size="sm">
            Shipped
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "DELIVERED", page: 1 })}>
          <Button variant={currentStatus === "DELIVERED" ? "default" : "outline"} size="sm">
            Delivered
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "COMPLETED", page: 1 })}>
          <Button
            variant={currentStatus === "COMPLETED" || currentStatus === "DELIVERY_CONFIRMED" ? "default" : "outline"}
            size="sm"
          >
            Completed
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "CANCELLED", page: 1 })}>
          <Button variant={currentStatus === "CANCELLED" ? "default" : "outline"} size="sm">
            Cancelled
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "RETURN_REQUESTED", page: 1 })}>
          <Button variant={currentStatus === "RETURN_REQUESTED" ? "default" : "outline"} size="sm">
            Return Requested
          </Button>
        </Link>
        <Link href={buildFilterUrl({ status: "DISPUTED", page: 1 })}>
          <Button variant={currentStatus === "DISPUTED" ? "default" : "outline"} size="sm">
            Disputed
          </Button>
        </Link>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {currentStatus
              ? `No ${currentStatus.toLowerCase().replace(/_/g, " ")} orders.`
              : "No orders in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <AdminOrdersTable orders={orders} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link href={buildFilterUrl({ page: pagination.page - 1 })}>
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link href={buildFilterUrl({ page: pagination.page + 1 })}>
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
