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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OverviewStats {
  totalSales: number;
  thisMonthSales: number;
  pendingBalance: number;
  availableBalance: number;
  totalOrders: number;
  averageOrderValue: number;
  trymeStats?: {
    totalSales: number;
    thisMonthSales: number;
    totalOrders: number;
    averageOrderValue: number;
    pendingBalance: number;
    availableBalance: number;
    reviewsCount: number;
  };
  websiteStats?: {
    totalSales: number;
    thisMonthSales: number;
    totalOrders: number;
    confirmedOrders: number;
    pendingVerificationSales: number;
    pendingActionOrders: number;
    averageOrderValue: number;
    inquiriesCount: number;
    newInquiriesCount: number;
    reviewsCount: number;
  };
  posStats?: {
    totalSales: number;
    thisMonthSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

interface VendorOverviewStatsProps {
  dateFrom?: string;
  dateTo?: string;
  basePath?: string;
}

export function VendorOverviewStats({
  dateFrom,
  dateTo,
  basePath = "/vendor",
}: VendorOverviewStatsProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<"tryme" | "website" | "pos" | "all">("tryme");

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
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

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch vendor overview stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateFrom, dateTo]);

  const tryme = stats?.trymeStats;
  const web = stats?.websiteStats;
  const pos = stats?.posStats;

  return (
    <div className="space-y-6">
      {/* Channel Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/40 p-2 rounded-2xl border">
        {/* TryMe.lk Marketplace Tab */}
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
              <p className="font-bold text-sm">TryMe.lk Marketplace</p>
              <p
                className={`text-xs ${
                  activeChannel === "tryme"
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                Marketplace sales &amp; wallet
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

        {/* My Website (Direct Store) Tab */}
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

        {/* POS Retail Counter Tab */}
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
                In-store physical receipts
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

        {/* Combined Overview Tab */}
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
      </div>

      {/* CHANNEL: TRYME.LK MARKETPLACE */}
      {activeChannel === "tryme" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label="TryMe.lk Sales"
            value={tryme ? formatCurrency(tryme.totalSales) : "-"}
            icon={DollarSign}
            color="green"
            isLoading={isLoading}
            description="Marketplace sales revenue"
          />

          <StatCard
            label="This Month (TryMe.lk)"
            value={tryme ? formatCurrency(tryme.thisMonthSales) : "-"}
            icon={TrendingUp}
            color="blue"
            isLoading={isLoading}
            description="Current month marketplace earnings"
          />

          <StatCard
            label="Pending Wallet Balance"
            value={tryme ? formatCurrency(tryme.pendingBalance) : "-"}
            icon={Clock}
            color="yellow"
            isLoading={isLoading}
            description="Marketplace funds awaiting release"
          />

          <StatCard
            label="Available Wallet Balance"
            value={tryme ? formatCurrency(tryme.availableBalance) : "-"}
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
      )}

      {/* CHANNEL: MY WEBSITE (DIRECT STORE) */}
      {activeChannel === "website" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Direct Website Sales"
              value={web ? formatCurrency(web.totalSales) : "-"}
              icon={DollarSign}
              color="green"
              isLoading={isLoading}
              description="Confirmed COD &amp; Bank Deposit revenue"
            />

            <StatCard
              label="This Month (Website)"
              value={web ? formatCurrency(web.thisMonthSales) : "-"}
              icon={TrendingUp}
              color="blue"
              isLoading={isLoading}
              description="Current month direct website sales"
            />

            <StatCard
              label="Total Website Orders"
              value={web ? web.totalOrders.toLocaleString() : "-"}
              icon={ShoppingCart}
              color="purple"
              isLoading={isLoading}
              description={`${web?.pendingActionOrders || 0} orders awaiting action`}
            />

            <StatCard
              label="Awaiting Slip Verification"
              value={web ? formatCurrency(web.pendingVerificationSales) : "-"}
              icon={Clock}
              color="yellow"
              isLoading={isLoading}
              description="Bank deposit orders pending verification"
            />

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
              <Link href={`${basePath}/website-builder`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Website Builder
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL: POS RETAIL COUNTER */}
      {activeChannel === "pos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="In-Store POS Sales"
              value={pos ? formatCurrency(pos.totalSales) : "-"}
              icon={DollarSign}
              color="green"
              isLoading={isLoading}
              description="Direct counter walk-in revenue"
            />

            <StatCard
              label="This Month (POS Sales)"
              value={pos ? formatCurrency(pos.thisMonthSales) : "-"}
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
              value={pos ? formatCurrency(pos.averageOrderValue) : "-"}
              icon={Package}
              color="orange"
              isLoading={isLoading}
              description="Average spend per physical walk-in"
            />
          </div>

          {/* POS Quick Management Banner */}
          <div className="border-2 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-600 text-white">Physical Store POS</Badge>
                <span className="text-xs text-muted-foreground">
                  Direct Cash &amp; Card Counter Collections (No Escrow / Immediate Cash in Hand)
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
              value={stats ? formatCurrency(stats.totalSales) : "-"}
              icon={DollarSign}
              color="green"
              isLoading={isLoading}
              description="TryMe.lk + Direct Website + POS"
            />

            <StatCard
              label="This Month Combined"
              value={stats ? formatCurrency(stats.thisMonthSales) : "-"}
              icon={TrendingUp}
              color="blue"
              isLoading={isLoading}
              description="Current month total earnings across channels"
            />

            <StatCard
              label="Pending Wallet Balance"
              value={stats ? formatCurrency(stats.pendingBalance) : "-"}
              icon={Clock}
              color="yellow"
              isLoading={isLoading}
              description="Marketplace funds awaiting release"
            />

            <StatCard
              label="Available Wallet Balance"
              value={stats ? formatCurrency(stats.availableBalance) : "-"}
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
              value={stats ? formatCurrency(stats.averageOrderValue) : "-"}
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
                  {tryme ? formatCurrency(tryme.totalSales) : "Rs. 0.00"}
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
                  {web ? formatCurrency(web.totalSales) : "Rs. 0.00"}
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
                  {pos ? formatCurrency(pos.totalSales) : "Rs. 0.00"}
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
