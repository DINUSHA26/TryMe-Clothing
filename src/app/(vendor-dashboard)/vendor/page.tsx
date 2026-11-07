"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useVendorAccess } from "@/hooks/useVendorAccess";
import { VendorOverviewStats } from "@/components/vendor/reports/VendorOverviewStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Store,
  Globe,
  ShoppingCart,
  MessageSquare,
  Star,
  Package,
  Wallet,
  Tag,
  MonitorDot,
  Receipt,
  Settings,
} from "lucide-react";

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const { canAccessPath, can, isOwner, roleName, storeName } = useVendorAccess();

  const showWebsite = isOwner || can("website.view") || canAccessPath("/vendor/website-builder");
  const showWallet = isOwner || can("wallet.view") || canAccessPath("/vendor/wallet");
  const showReports = isOwner || can("wallet.view") || canAccessPath("/vendor/reports");
  const showPos = isOwner || can("pos.view") || canAccessPath("/vendor/pos");
  const showProducts = isOwner || can("products.view") || canAccessPath("/vendor/products");
  const showOrders = isOwner || can("orders.view") || canAccessPath("/vendor/orders");
  const showCoupons = isOwner || can("coupons.view") || canAccessPath("/vendor/coupons");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            {!isOwner && roleName && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {roleName}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back, {user?.firstName || user?.email} —{" "}
            {isOwner
              ? "manage your TryMe.lk store, physical POS counter and standalone website"
              : `${storeName || "Store"} operational dashboard`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showWebsite && (
            <Link href="/vendor/website-builder">
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Website Builder
              </Button>
            </Link>
          )}
          {showReports && (
            <Link href="/vendor/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Full Reports
              </Button>
            </Link>
          )}
          {showPos && (
            <Link href="/vendor/pos">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold">
                <MonitorDot className="h-4 w-4" />
                Open POS Terminal
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid - Role-Adaptive Omnichannel Metrics */}
      <VendorOverviewStats />

      {/* Role-Adaptive Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace / Store Operations Quick Actions */}
        <div className="bg-card rounded-xl border p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isOwner ? "TryMe.lk Marketplace" : "Store Catalog & Orders"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isOwner
                  ? "Manage marketplace catalog, customer orders, wallet & reviews"
                  : "Handle product listings, stock variations and incoming orders"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showOrders && (
              <Link href="/vendor/orders?source=tryme">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  TryMe.lk Orders
                </Button>
              </Link>
            )}
            {showProducts && (
              <Link href="/vendor/products">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Manage Products
                </Button>
              </Link>
            )}
            {showWallet && (
              <Link href="/vendor/wallet">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Wallet &amp; Payouts
                </Button>
              </Link>
            )}
            {showCoupons && (
              <Link href="/vendor/coupons">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Manage Coupons
                </Button>
              </Link>
            )}
            {showPos && !showWallet && (
              <Link href="/vendor/pos">
                <Button variant="outline" className="w-full justify-start gap-2 border-amber-500/30 hover:bg-amber-500/10">
                  <MonitorDot className="h-4 w-4 text-amber-600" />
                  Launch POS Terminal
                </Button>
              </Link>
            )}
            {canAccessPath("/vendor/reviews") && (
              <Link href="/vendor/reviews">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Customer Reviews
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Second Panel: Standalone Website OR In-Store POS Operations */}
        {showWebsite ? (
          <div className="bg-card rounded-xl border border-emerald-500/20 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">My Website (Direct Store)</h2>
                <p className="text-xs text-muted-foreground">
                  Manage direct website COD/Bank orders, 1-page inquiries &amp; website reviews
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/vendor/orders?source=website">
                <Button variant="outline" className="w-full justify-start gap-2 border-emerald-500/30 hover:bg-emerald-500/10">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  Direct Website Orders
                </Button>
              </Link>
              <Link href="/vendor/orders?source=inquiries">
                <Button variant="outline" className="w-full justify-start gap-2 border-emerald-500/30 hover:bg-emerald-500/10">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Website Inquiries
                </Button>
              </Link>
              <Link href="/vendor/reviews">
                <Button variant="outline" className="w-full justify-start gap-2 border-emerald-500/30 hover:bg-emerald-500/10">
                  <Star className="h-4 w-4 text-emerald-600" />
                  Website Reviews
                </Button>
              </Link>
              <Link href="/vendor/website-builder">
                <Button variant="outline" className="w-full justify-start gap-2 border-emerald-500/30 hover:bg-emerald-500/10">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  Checkout &amp; Store Settings
                </Button>
              </Link>
            </div>
          </div>
        ) : showPos ? (
          <div className="bg-card rounded-xl border border-amber-500/20 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <MonitorDot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">POS Retail &amp; Counter Operations</h2>
                <p className="text-xs text-muted-foreground">
                  Quick actions for walk-in billing, barcode lookup and receipt history
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/vendor/pos">
                <Button className="w-full justify-start gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                  <MonitorDot className="h-4 w-4" />
                  Launch POS Terminal
                </Button>
              </Link>
              <Link href="/vendor/orders?source=pos">
                <Button variant="outline" className="w-full justify-start gap-2 border-amber-500/30 hover:bg-amber-500/10">
                  <Receipt className="h-4 w-4 text-amber-600" />
                  POS Counter Receipts
                </Button>
              </Link>
              <Link href="/vendor/products">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Lookup Stock / Barcodes
                </Button>
              </Link>
              <Link href="/vendor/orders">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  All Counter Orders
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
