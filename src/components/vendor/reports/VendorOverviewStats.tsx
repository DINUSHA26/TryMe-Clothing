"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/reports/StatCard";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  Wallet,
  Store,
  Globe,
  MessageSquare,
  Star,
  ArrowRight,
  Layers,
  MonitorDot,
  Receipt,
  CheckCircle2,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVendorAccess } from "@/hooks/useVendorAccess";
import { useAdsSellerAccess } from "@/hooks/useAdsSellerAccess";

function safeFormatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return "-";
  return formatCurrency(val);
}

interface OverviewStats {
  hasFinancialAccess?: boolean;
  totalSales?: number | null;
  thisMonthSales?: number | null;
  pendingBalance?: number | null;
  availableBalance?: number | null;
  totalOrders: number;
  averageOrderValue?: number | null;
  trymeStats?: {
    totalSales?: number | null;
    thisMonthSales?: number | null;
    totalOrders: number;
    averageOrderValue?: number | null;
    pendingBalance?: number | null;
    availableBalance?: number | null;
    reviewsCount: number;
  };
  websiteStats?: {
    totalSales?: number | null;
    thisMonthSales?: number | null;
    totalOrders: number;
    confirmedOrders: number;
    pendingVerificationSales?: number | null;
    pendingActionOrders: number;
    averageOrderValue?: number | null;
    inquiriesCount: number;
    newInquiriesCount: number;
    reviewsCount: number;
  };
  posStats?: {
    totalSales?: number | null;
    thisMonthSales?: number | null;
    totalOrders: number;
    averageOrderValue?: number | null;
  };
  operationalStats?: {
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    todayOrders: number;
    todayPosOrders: number;
    pendingFulfillment: number;
  };
  roleInfo?: {
    isOwner: boolean;
    roleName?: string;
    permissions: string[];
    hasFinancialAccess: boolean;
  };
}

interface VendorOverviewStatsProps {
  dateFrom?: string;
  dateTo?: string;
  basePath?: string;
}

// Module-level Stale-While-Revalidate cache for instant 0ms switching
const statsCache = new Map<string, { data: OverviewStats; time: number }>();
const STATS_CACHE_STALE_MS = 20_000;

export function VendorOverviewStats({
  dateFrom,
  dateTo,
  basePath = "/vendor",
}: VendorOverviewStatsProps) {
  const cacheKey = `${basePath}:${dateFrom || ""}:${dateTo || ""}`;
  const initialCached = statsCache.get(cacheKey);

  const [stats, setStats] = useState<OverviewStats | null>(initialCached?.data || null);
  const [isLoading, setIsLoading] = useState(!initialCached);
  const [activeChannel, setActiveChannel] = useState<"tryme" | "website" | "pos" | "all">("tryme");

  const isAds = basePath.startsWith("/ads-seller");
  const vendorAccess = useVendorAccess();
  const adsAccess = useAdsSellerAccess();
  const access = isAds ? adsAccess : vendorAccess;

  const hasFinancialAccess = stats?.hasFinancialAccess ?? (access.isOwner || access.can("wallet.view"));
  const canPos = access.isOwner || access.can("pos.view") || access.canAccessPath(`${basePath}/pos`);
  const canWebsite = access.isOwner || access.can("website.view") || access.canAccessPath(`${basePath}/website-builder`);
  const canOrders = access.isOwner || access.can("orders.view") || access.canAccessPath(`${basePath}/orders`);
  const canProducts = access.isOwner || access.can("products.view") || access.canAccessPath(`${basePath}/products`);

  useEffect(() => {
    // Role-adaptive default active tab for non-financial staff:
    if (!hasFinancialAccess) {
      if (canPos && !canWebsite) {
        setActiveChannel("pos");
      } else if (canWebsite && !canPos) {
        setActiveChannel("website");
      } else {
        setActiveChannel("tryme");
      }
    }
  }, [hasFinancialAccess, canPos, canWebsite]);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      const cached = statsCache.get(cacheKey);
      if (cached) {
        setStats(cached.data);
        setIsLoading(false);
        // If data is very fresh (less than 20s old), skip network call
        if (Date.now() - cached.time < STATS_CACHE_STALE_MS) {
          return;
        }
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/vendor/reports/overview?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (data.success && isMounted) {
          setStats(data.data);
          statsCache.set(cacheKey, { data: data.data, time: Date.now() });
        }
      } catch (error) {
        console.error("Failed to fetch vendor overview stats:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [dateFrom, dateTo, cacheKey]);

  const tryme = stats?.trymeStats;
  const web = stats?.websiteStats;
  const pos = stats?.posStats;

  return (
    <div className="space-y-6">
      {/* Channel Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/40 p-2 rounded-2xl border">
        {/* TryMe.lk Marketplace Tab (Shown to Owners & Staff with catalog/order permissions) */}
        {(hasFinancialAccess || canOrders || canProducts) && (
          <button
            type="button"
            onClick={() => setActiveChannel("tryme")}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeChannel === "tryme"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background hover:bg-muted/60 text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeChannel === "tryme"
                    ? "bg-white/20"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {hasFinancialAccess ? "TryMe.lk Marketplace" : "Marketplace & Catalog"}
                </p>
                <p
                  className={`text-xs ${
                    activeChannel === "tryme"
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {hasFinancialAccess ? "Marketplace sales & wallet" : "Catalog & fulfillment"}
                </p>
              </div>
            </div>
            <Badge
              variant={activeChannel === "tryme" ? "secondary" : "outline"}
              className="font-bold text-xs"
            >
              {tryme ? `${tryme.totalOrders} orders` : "..."}
            </Badge>
          </button>
        )}

        {/* My Website (Direct Store) Tab (Shown to Owners & Staff with website permission) */}
        {(hasFinancialAccess || canWebsite) && (
          <button
            type="button"
            onClick={() => setActiveChannel("website")}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeChannel === "website"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-background hover:bg-muted/60 text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeChannel === "website"
                    ? "bg-white/20"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">My Website (Direct)</p>
                <p
                  className={`text-xs ${
                    activeChannel === "website"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  }`}
                >
                  COD &amp; Bank direct payments
                </p>
              </div>
            </div>
            <Badge
              variant={activeChannel === "website" ? "secondary" : "outline"}
              className="font-bold text-xs"
            >
              {web ? `${web.totalOrders} orders` : "..."}
            </Badge>
          </button>
        )}

        {/* POS Retail Counter Tab (Shown to Owners & Cashiers/Staff with pos permission) */}
        {(hasFinancialAccess || canPos) && (
          <button
            type="button"
            onClick={() => setActiveChannel("pos")}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeChannel === "pos"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-background hover:bg-muted/60 text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeChannel === "pos"
                    ? "bg-white/20"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                <MonitorDot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">POS Retail Counter</p>
                <p
                  className={`text-xs ${
                    activeChannel === "pos"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  }`}
                >
                  In-store counter sales &amp; billing
                </p>
              </div>
            </div>
            <Badge
              variant={activeChannel === "pos" ? "secondary" : "outline"}
              className="font-bold text-xs"
            >
              {pos ? `${pos.totalOrders} receipts` : "..."}
            </Badge>
          </button>
        )}

        {/* Combined Overview Tab (Reserved strictly for Store Owners / Financial clearance) */}
        {hasFinancialAccess && (
          <button
            type="button"
            onClick={() => setActiveChannel("all")}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeChannel === "all"
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-background hover:bg-muted/60 text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeChannel === "all"
                    ? "bg-white/20"
                    : "bg-slate-500/10 text-slate-600"
                }`}
              >
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Combined Overview</p>
                <p
                  className={`text-xs ${
                    activeChannel === "all"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  }`}
                >
                  All 3 revenue streams
                </p>
              </div>
            </div>
            <Badge
              variant={activeChannel === "all" ? "secondary" : "outline"}
              className="font-bold text-xs"
            >
              {stats ? `${stats.totalOrders} total` : "..."}
            </Badge>
          </button>
        )}
      </div>

      {/* CHANNEL: TRYME.LK MARKETPLACE */}
      {activeChannel === "tryme" && (
        <div className="space-y-6">
          {hasFinancialAccess ? (
            /* Executive Financial Cards for Store Owner */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="TryMe.lk Sales"
                value={safeFormatCurrency(tryme?.totalSales)}
                icon={DollarSign}
                color="green"
                isLoading={isLoading}
                description="Marketplace sales revenue"
              />

              <StatCard
                label="This Month (TryMe.lk)"
                value={safeFormatCurrency(tryme?.thisMonthSales)}
                icon={TrendingUp}
                color="blue"
                isLoading={isLoading}
                description="Current month marketplace earnings"
              />

              <StatCard
                label="Pending Wallet Balance"
                value={safeFormatCurrency(tryme?.pendingBalance)}
                icon={Clock}
                color="yellow"
                isLoading={isLoading}
                description="Marketplace funds awaiting release"
              />

              <StatCard
                label="Available Wallet Balance"
                value={safeFormatCurrency(tryme?.availableBalance)}
                icon={Wallet}
                color="purple"
                isLoading={isLoading}
                description="Ready for payout"
              />

              <StatCard
                label="TryMe.lk Orders"
                value={tryme ? tryme.totalOrders.toLocaleString() : "-"}
                icon={ShoppingCart}
                color="blue"
                isLoading={isLoading}
                description="Items sold on TryMe.lk"
              />

              <StatCard
                label="Marketplace Reviews"
                value={tryme ? tryme.reviewsCount.toLocaleString() : "-"}
                icon={Star}
                color="orange"
                isLoading={isLoading}
                description="Verified TryMe.lk buyer reviews"
              />
            </div>
          ) : (
            /* Role-Adaptive Operational Cards for Store Staff (Catalog / Fulfillment) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="Active Products"
                value={stats?.operationalStats ? stats.operationalStats.activeProducts.toLocaleString() : "-"}
                icon={Package}
                color="blue"
                isLoading={isLoading}
                description="Products currently active and visible to buyers"
              />

              <StatCard
                label="Low Stock Alert"
                value={stats?.operationalStats ? stats.operationalStats.lowStockCount.toLocaleString() : "-"}
                icon={AlertTriangle}
                color="yellow"
                isLoading={isLoading}
                description="Items with stock 5 or fewer units"
              />

              <StatCard
                label="Out of Stock Items"
                value={stats?.operationalStats ? stats.operationalStats.outOfStockCount.toLocaleString() : "-"}
                icon={Package}
                color="red"
                isLoading={isLoading}
                description="Catalog products sold out"
              />

              <StatCard
                label="Orders Awaiting Dispatch"
                value={stats?.operationalStats ? stats.operationalStats.pendingFulfillment.toLocaleString() : "-"}
                icon={ShoppingCart}
                color="purple"
                isLoading={isLoading}
                description="Orders in payment confirmed / processing"
              />

              <StatCard
                label="TryMe.lk Orders"
                value={tryme ? tryme.totalOrders.toLocaleString() : "-"}
                icon={CheckCircle2}
                color="green"
                isLoading={isLoading}
                description="Total marketplace customer orders"
              />

              <StatCard
                label="Marketplace Reviews"
                value={tryme ? tryme.reviewsCount.toLocaleString() : "-"}
                icon={Star}
                color="orange"
                isLoading={isLoading}
                description="Verified buyer ratings & reviews"
              />
            </div>
          )}

          {/* Quick Staff Navigation */}
          {!hasFinancialAccess && (
            <div className="border border-border bg-card rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-medium text-xs">
                    {access.roleName || "Store Staff"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Store Operations Center</span>
                </div>
                <h3 className="font-bold text-base">Product Catalog &amp; Order Processing</h3>
                <p className="text-xs text-muted-foreground">
                  Update inventory variants, fulfill incoming customer shipments, or check customer reviews.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {canProducts && (
                  <Link href={`${basePath}/products`}>
                    <Button size="sm" className="gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Manage Products ({stats?.operationalStats?.activeProducts || 0})
                    </Button>
                  </Link>
                )}
                {canOrders && (
                  <Link href={`${basePath}/orders?source=tryme`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Orders ({tryme?.totalOrders || 0})
                    </Button>
                  </Link>
                )}
                {canPos && (
                  <Link href={`${basePath}/pos`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-500/30">
                      <MonitorDot className="w-3.5 h-3.5" />
                      Open POS
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHANNEL: MY WEBSITE (DIRECT STORE) */}
      {activeChannel === "website" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hasFinancialAccess ? (
              <StatCard
                label="Direct Website Sales"
                value={safeFormatCurrency(web?.totalSales)}
                icon={DollarSign}
                color="green"
                isLoading={isLoading}
                description="Confirmed COD &amp; Bank Deposit revenue"
              />
            ) : (
              <StatCard
                label="Active Products"
                value={stats?.operationalStats ? stats.operationalStats.activeProducts.toLocaleString() : "-"}
                icon={Package}
                color="green"
                isLoading={isLoading}
                description="Products published to website"
              />
            )}

            {hasFinancialAccess ? (
              <StatCard
                label="This Month (Website)"
                value={safeFormatCurrency(web?.thisMonthSales)}
                icon={TrendingUp}
                color="blue"
                isLoading={isLoading}
                description="Current month direct website sales"
              />
            ) : (
              <StatCard
                label="Confirmed Website Orders"
                value={web ? web.confirmedOrders.toLocaleString() : "-"}
                icon={CheckCircle2}
                color="blue"
                isLoading={isLoading}
                description="Orders ready for dispatch"
              />
            )}

            <StatCard
              label="Total Website Orders"
              value={web ? web.totalOrders.toLocaleString() : "-"}
              icon={ShoppingCart}
              color="purple"
              isLoading={isLoading}
              description={`${web?.pendingActionOrders || 0} orders awaiting action`}
            />

            {hasFinancialAccess ? (
              <StatCard
                label="Awaiting Slip Verification"
                value={safeFormatCurrency(web?.pendingVerificationSales)}
                icon={Clock}
                color="yellow"
                isLoading={isLoading}
                description="Bank deposit orders pending verification"
              />
            ) : (
              <StatCard
                label="Awaiting Bank Slip Check"
                value={web ? `${web.pendingActionOrders || 0} orders` : "-"}
                icon={Clock}
                color="yellow"
                isLoading={isLoading}
                description="Bank deposit orders pending slip confirmation"
              />
            )}

            <StatCard
              label="Website Inquiries"
              value={web ? web.inquiriesCount.toLocaleString() : "-"}
              icon={MessageSquare}
              color="blue"
              isLoading={isLoading}
              description={`${web?.newInquiriesCount || 0} new inquiries from customers`}
            />

            <StatCard
              label="Website Direct Reviews"
              value={web ? web.reviewsCount.toLocaleString() : "-"}
              icon={Star}
              color="orange"
              isLoading={isLoading}
              description="Reviews submitted on your website"
            />
          </div>

          {/* Direct Website Quick Management Banner */}
          <div className="border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">Direct Store Management</Badge>
                <span className="text-xs text-muted-foreground">
                  100% Direct Customer Payments (COD &amp; Bank Deposit)
                </span>
              </div>
              <h3 className="font-bold text-base">
                Manage Your Standalone Website Orders, Inquiries &amp; Reviews
              </h3>
              <p className="text-xs text-muted-foreground">
                Verify customer bank deposit slips, update shipping tracking, reply to 1-page inquiries via WhatsApp, or customize checkout settings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href={`${basePath}/orders?source=website`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Website Orders ({web?.totalOrders || 0})
                </Button>
              </Link>
              <Link href={`${basePath}/orders?source=inquiries`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Inquiries ({web?.inquiriesCount || 0})
                </Button>
              </Link>
              <Link href={`${basePath}/reviews`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Website Reviews ({web?.reviewsCount || 0})
                </Button>
              </Link>
              {(hasFinancialAccess || canWebsite) && (
                <Link href={`${basePath}/website-builder`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Website Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL: POS RETAIL COUNTER */}
      {activeChannel === "pos" && (
        <div className="space-y-6">
          {hasFinancialAccess ? (
            /* Executive POS Financial Overview for Store Owner */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="In-Store POS Sales"
                value={safeFormatCurrency(pos?.totalSales)}
                icon={DollarSign}
                color="green"
                isLoading={isLoading}
                description="Direct counter walk-in revenue"
              />

              <StatCard
                label="This Month (POS Sales)"
                value={safeFormatCurrency(pos?.thisMonthSales)}
                icon={TrendingUp}
                color="blue"
                isLoading={isLoading}
                description="Current month counter receipts"
              />

              <StatCard
                label="Walk-In Receipts Issued"
                value={pos ? pos.totalOrders.toLocaleString() : "-"}
                icon={ShoppingCart}
                color="purple"
                isLoading={isLoading}
                description="Total completed POS counter sales"
              />

              <StatCard
                label="Average POS Basket Value"
                value={safeFormatCurrency(pos?.averageOrderValue)}
                icon={Package}
                color="orange"
                isLoading={isLoading}
                description="Average spend per physical walk-in"
              />

              <StatCard
                label="Today's Walk-In Receipts"
                value={stats?.operationalStats ? stats.operationalStats.todayPosOrders.toLocaleString() : "-"}
                icon={Receipt}
                color="green"
                isLoading={isLoading}
                description="Counter receipts generated today"
              />

              <StatCard
                label="Active Products in Store"
                value={stats?.operationalStats ? stats.operationalStats.activeProducts.toLocaleString() : "-"}
                icon={CheckCircle2}
                color="blue"
                isLoading={isLoading}
                description="Available items for counter checkout"
              />
            </div>
          ) : (
            /* Industry-Standard POS & Retail Metrics for Cashiers / POS Operators */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="Today's Walk-In Receipts"
                value={stats?.operationalStats ? stats.operationalStats.todayPosOrders.toLocaleString() : "0"}
                icon={Receipt}
                color="green"
                isLoading={isLoading}
                description="Receipts generated at POS counter today"
              />

              <StatCard
                label="Active Products for Sale"
                value={stats?.operationalStats ? stats.operationalStats.activeProducts.toLocaleString() : "0"}
                icon={Package}
                color="blue"
                isLoading={isLoading}
                description="Items available for instant barcode scan &amp; billing"
              />

              <StatCard
                label="Low Stock Alert"
                value={stats?.operationalStats ? stats.operationalStats.lowStockCount.toLocaleString() : "0"}
                icon={AlertTriangle}
                color="yellow"
                isLoading={isLoading}
                description="Products needing replenishment (<= 5 units)"
              />

              <StatCard
                label="Total Counter Receipts"
                value={pos ? pos.totalOrders.toLocaleString() : "0"}
                icon={MonitorDot}
                color="purple"
                isLoading={isLoading}
                description="Lifetime POS transactions recorded"
              />

              <StatCard
                label="Today's Store Orders"
                value={stats?.operationalStats ? stats.operationalStats.todayOrders.toLocaleString() : "0"}
                icon={ShoppingCart}
                color="blue"
                isLoading={isLoading}
                description="Total orders across store channels today"
              />

              <StatCard
                label="POS Terminal Status"
                value="Active &amp; Ready"
                icon={CheckCircle2}
                color="green"
                isLoading={isLoading}
                description="Counter barcode scanning &amp; receipts active"
              />
            </div>
          )}

          {/* POS Quick Management Banner */}
          <div className="border-2 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-600 text-white">Physical Store POS</Badge>
                <span className="text-xs text-muted-foreground">
                  Direct Cash &amp; Card Counter Collections (Immediate Cash in Hand)
                </span>
              </div>
              <h3 className="font-bold text-base">
                In-Store Point of Sale &amp; Walk-In Counter Management
              </h3>
              <p className="text-xs text-muted-foreground">
                Ring up walk-in customers instantly, scan barcodes, print thermal receipts, and maintain live stock sync across all your sales channels.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href={`${basePath}/pos`}>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                  <MonitorDot className="w-3.5 h-3.5" />
                  Open POS Terminal
                </Button>
              </Link>
              <Link href={`${basePath}/orders?source=pos`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  POS Receipts ({pos?.totalOrders || 0})
                </Button>
              </Link>
              {canProducts && (
                <Link href={`${basePath}/products`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Product Stock ({stats?.operationalStats?.activeProducts || 0})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL: COMBINED OVERVIEW */}
      {activeChannel === "all" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Total Combined Sales"
              value={safeFormatCurrency(stats?.totalSales)}
              icon={DollarSign}
              color="green"
              isLoading={isLoading}
              description="TryMe.lk + Direct Website + POS"
            />

            <StatCard
              label="This Month Combined"
              value={safeFormatCurrency(stats?.thisMonthSales)}
              icon={TrendingUp}
              color="blue"
              isLoading={isLoading}
              description="Current month total earnings across channels"
            />

            <StatCard
              label="Pending Wallet Balance"
              value={safeFormatCurrency(stats?.pendingBalance)}
              icon={Clock}
              color="yellow"
              isLoading={isLoading}
              description="Marketplace funds awaiting release"
            />

            <StatCard
              label="Available Wallet Balance"
              value={safeFormatCurrency(stats?.availableBalance)}
              icon={Wallet}
              color="purple"
              isLoading={isLoading}
              description="Ready for payout via TryMe Wallet"
            />

            <StatCard
              label="Total Combined Orders"
              value={stats ? stats.totalOrders.toLocaleString() : "-"}
              icon={ShoppingCart}
              color="blue"
              isLoading={isLoading}
              description="Total orders &amp; physical receipts"
            />

            <StatCard
              label="Average Order Value"
              value={safeFormatCurrency(stats?.averageOrderValue)}
              icon={Package}
              color="orange"
              isLoading={isLoading}
              description="Mean ticket across all channels"
            />
          </div>

          {/* 3-Stream Channel Breakdown Summary Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Omnichannel Revenue Breakdown</h3>
                <p className="text-xs text-muted-foreground">Detailed distribution of sales across all your 3 selling streams</p>
              </div>
              <Badge variant="outline" className="font-semibold text-xs">3 Channels Active</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TryMe Marketplace Stream */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-foreground">TryMe.lk Marketplace</span>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">Wallet Escrow</Badge>
                </div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {safeFormatCurrency(tryme?.totalSales)}
                </p>
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                  <span>{tryme?.totalOrders || 0} online orders</span>
                  <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Withdrawable via Wallet</span>
                </div>
              </div>

              {/* Direct Website Stream */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-foreground">Standalone Website</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">Self-Collected</Badge>
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {safeFormatCurrency(web?.totalSales)}
                </p>
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <span>{web?.totalOrders || 0} storefront orders</span>
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Direct COD / Bank Deposit</span>
                </div>
              </div>

              {/* In-Store POS Stream */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MonitorDot className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-foreground">In-Store POS Counter</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">Immediate Cash/Card</Badge>
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {safeFormatCurrency(pos?.totalSales)}
                </p>
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span>{pos?.totalOrders || 0} walk-in receipts</span>
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Collected at Till Counter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
