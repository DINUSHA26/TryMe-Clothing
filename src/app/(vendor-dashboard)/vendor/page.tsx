"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { VendorOverviewStats } from "@/components/vendor/reports/VendorOverviewStats";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function VendorDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName || user?.email} — manage your TryMe.lk store and standalone website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/vendor/website-builder">
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              Website Builder
            </Button>
          </Link>
          <Link href="/vendor/reports">
            <Button>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Full Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Separated by Channel (TryMe.lk vs My Website) */}
      <VendorOverviewStats />

      {/* Dual Quick Actions: TryMe.lk Marketplace vs My Standalone Website */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TryMe.lk Marketplace Quick Actions */}
        <div className="bg-card rounded-xl border p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">TryMe.lk Marketplace</h2>
              <p className="text-xs text-muted-foreground">
                Manage your marketplace catalog, orders, wallet &amp; reviews
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/vendor/orders?source=tryme">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                TryMe.lk Orders
              </Button>
            </Link>
            <Link href="/vendor/products">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Manage Products
              </Button>
            </Link>
            <Link href="/vendor/wallet">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                Wallet &amp; Payouts
              </Button>
            </Link>
            <Link href="/vendor/coupons">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Manage Coupons
              </Button>
            </Link>
          </div>
        </div>

        {/* Standalone Website Quick Actions */}
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
      </div>
    </div>
  );
}
