/**
 * Ads Seller Orders Page
 * Separates TryMe.lk Marketplace Orders, Direct Website Orders (COD / Bank Deposit), and Website Inquiries
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";
import { getVendorOrders as getVendorOrdersDirect } from "@/lib/services/vendor-order-service";
import { VendorOrdersTable } from "@/components/vendor/orders/VendorOrdersTable";
import { WebsiteInquiriesManager } from "@/components/vendor/orders/WebsiteInquiriesManager";
import { Package, Store, Globe, Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
  source?: "tryme" | "website" | "inquiries" | "all";
}

async function getAdsSellerOrders(searchParams: SearchParams) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  try {
    const sellerVendor = await getOrCreateAdsSellerVendor(payload.userId);

    if (!sellerVendor) {
      return { error: "Ads seller profile not found" };
    }

    const data = await getVendorOrdersDirect(sellerVendor.vendor.id, {
      page: searchParams.page,
      status: searchParams.status,
      source: searchParams.source || "tryme",
      pageSize: "20",
    });
    return data;
  } catch (error: any) {
    console.error("[AdsSellerOrdersPage] Error:", error);
    return { error: error.message || "Failed to fetch orders" };
  }
}

export default async function AdsSellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const currentSource = resolvedParams.source || "tryme";
  const currentStatus = resolvedParams.status;

  const result = (await getAdsSellerOrders(resolvedParams)) as any;

  if (!result) {
    redirect("/login");
  }

  if ("error" in result) {
    if (result.status === 401) {
      redirect("/login");
    }

    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-muted-foreground mb-8">{result.error}</p>
        <Link href="/ads-seller">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const {
    orders,
    websiteInquiries = [],
    channelCounts = { tryme: 0, website: 0, inquiries: 0 },
    pagination,
    stats,
  } = result;

  const buildFilterHref = (statusVal?: string) => {
    const p = new URLSearchParams();
    p.set("source", currentSource);
    if (statusVal) p.set("status", statusVal);
    return `/ads-seller/orders?${p.toString()}`;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage orders from TryMe.lk Marketplace and direct orders &amp; inquiries from your standalone website
          </p>
        </div>
        <Link href="/ads-seller/website-builder">
          <Button variant="outline" size="sm" className="font-bold">
            <Store className="w-4 h-4 mr-2 text-primary" />
            Website Checkout Settings
          </Button>
        </Link>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/40 p-2 rounded-2xl border">
        <Link href="/ads-seller/orders?source=tryme">
          <div
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              currentSource === "tryme"
                ? "bg-card shadow-sm border-primary/40 ring-1 ring-primary/20"
                : "bg-transparent border-transparent hover:bg-card/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm">TryMe.lk Orders</p>
                <p className="text-[11px] text-muted-foreground">Marketplace</p>
              </div>
            </div>
            <Badge variant={currentSource === "tryme" ? "default" : "secondary"} className="font-bold">
              {channelCounts.tryme}
            </Badge>
          </div>
        </Link>

        <Link href="/ads-seller/orders?source=website">
          <div
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              currentSource === "website"
                ? "bg-card shadow-sm border-indigo-500/40 ring-1 ring-indigo-500/20"
                : "bg-transparent border-transparent hover:bg-card/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm">My Website Orders</p>
                <p className="text-[11px] text-muted-foreground">Direct COD &amp; Bank</p>
              </div>
            </div>
            <Badge
              className={
                currentSource === "website"
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-indigo-500/10 text-indigo-700 font-bold"
              }
            >
              {channelCounts.website}
            </Badge>
          </div>
        </Link>

        <Link href="/ads-seller/orders?source=inquiries">
          <div
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              currentSource === "inquiries"
                ? "bg-card shadow-sm border-emerald-500/40 ring-1 ring-emerald-500/20"
                : "bg-transparent border-transparent hover:bg-card/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm">Website Inquiries</p>
                <p className="text-[11px] text-muted-foreground">1-Page &amp; Direct Leads</p>
              </div>
            </div>
            <Badge
              className={
                currentSource === "inquiries"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-emerald-500/10 text-emerald-700 font-bold"
              }
            >
              {channelCounts.inquiries}
            </Badge>
          </div>
        </Link>

        <Link href="/ads-seller/orders?source=all">
          <div
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              currentSource === "all"
                ? "bg-card shadow-sm border-primary/40 ring-1 ring-primary/20"
                : "bg-transparent border-transparent hover:bg-card/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm">All Combined</p>
                <p className="text-[11px] text-muted-foreground">Every Channel</p>
              </div>
            </div>
            <Badge variant="outline" className="font-bold">
              {channelCounts.tryme + channelCounts.website}
            </Badge>
          </div>
        </Link>
      </div>

      {currentSource === "inquiries" ? (
        /* ── WEBSITE INQUIRIES TAB ── */
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Website Direct Inquiries &amp; 1-Page Orders</h2>
              <p className="text-xs text-muted-foreground">
                Customers who inquired about products or services via your website inquiry form appear here. Reply directly via WhatsApp or Email.
              </p>
            </div>
          </div>
          <WebsiteInquiriesManager initialInquiries={websiteInquiries} />
        </div>
      ) : (
        /* ── ORDERS VIEW (TRYME OR WEBSITE DIRECT OR ALL) ── */
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                {currentSource === "website"
                  ? "Total Website Orders"
                  : currentSource === "tryme"
                  ? "Total TryMe Orders"
                  : "Total Orders"}
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            {currentSource !== "tryme" && (
              <div className="border rounded-xl p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Awaiting Bank Verification
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pendingVerification || 0}
                </p>
              </div>
            )}
            <div className="border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Payment Confirmed / COD
              </p>
              <p className="text-2xl font-bold">{stats.paymentConfirmed}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <div className="border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Shipped / Delivered
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {(stats.shipped || 0) + (stats.delivered || 0)}
              </p>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Link href={buildFilterHref()}>
              <Button variant={!currentStatus ? "default" : "outline"} size="sm">
                All Orders
              </Button>
            </Link>
            {currentSource !== "tryme" && (
              <Link href={buildFilterHref("PENDING_VERIFICATION")}>
                <Button
                  variant={
                    currentStatus === "PENDING_VERIFICATION" ? "default" : "outline"
                  }
                  size="sm"
                >
                  Pending Bank Verification
                </Button>
              </Link>
            )}
            <Link href={buildFilterHref("PAYMENT_CONFIRMED")}>
              <Button
                variant={
                  currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
                }
                size="sm"
              >
                Confirmed / COD Ready
              </Button>
            </Link>
            <Link href={buildFilterHref("PROCESSING")}>
              <Button
                variant={currentStatus === "PROCESSING" ? "default" : "outline"}
                size="sm"
              >
                Processing
              </Button>
            </Link>
            <Link href={buildFilterHref("SHIPPED")}>
              <Button
                variant={currentStatus === "SHIPPED" ? "default" : "outline"}
                size="sm"
              >
                Shipped
              </Button>
            </Link>
            <Link href={buildFilterHref("DELIVERED")}>
              <Button
                variant={currentStatus === "DELIVERED" ? "default" : "outline"}
                size="sm"
              >
                Delivered
              </Button>
            </Link>
            <Link href={buildFilterHref("COMPLETED")}>
              <Button
                variant={currentStatus === "COMPLETED" ? "default" : "outline"}
                size="sm"
              >
                Completed
              </Button>
            </Link>
            <Link href={buildFilterHref("CANCELLED")}>
              <Button
                variant={currentStatus === "CANCELLED" ? "default" : "outline"}
                size="sm"
              >
                Cancelled
              </Button>
            </Link>
          </div>

          {/* Orders Table */}
          {orders.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-muted/10">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {currentSource === "website"
                  ? "No Direct Website Orders Found"
                  : "No TryMe.lk Marketplace Orders Found"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {currentStatus
                  ? `No ${currentStatus.toLowerCase().replace("_", " ")} orders in this channel.`
                  : currentSource === "website"
                  ? "Orders placed by customers on your website (COD or Bank Deposit) will appear here."
                  : "Orders placed on TryMe.lk containing your products will appear here."}
              </p>
            </div>
          ) : (
            <>
              <VendorOrdersTable orders={orders} linkPrefix="/ads-seller/orders" />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {pagination.page > 1 && (
                    <Link
                      href={`/ads-seller/orders?source=${currentSource}&page=${
                        pagination.page - 1
                      }${currentStatus ? `&status=${currentStatus}` : ""}`}
                    >
                      <Button variant="outline">Previous</Button>
                    </Link>
                  )}
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  {pagination.page < pagination.totalPages && (
                    <Link
                      href={`/ads-seller/orders?source=${currentSource}&page=${
                        pagination.page + 1
                      }${currentStatus ? `&status=${currentStatus}` : ""}`}
                    >
                      <Button variant="outline">Next</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
