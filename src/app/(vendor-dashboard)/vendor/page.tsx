"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { VendorOverviewStats } from "@/components/vendor/reports/VendorOverviewStats";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function VendorDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName || user?.email}
          </p>
        </div>
        <Link href="/vendor/reports">
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Full Reports
          </Button>
        </Link>
      </div>

      {/* Stats Grid - Real Data */}
      <VendorOverviewStats />

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border p-4 md:p-8">
        <h2 className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/vendor/products">
            <Button variant="outline" className="w-full justify-start">
              Manage Products
            </Button>
          </Link>
          <Link href="/vendor/orders">
            <Button variant="outline" className="w-full justify-start">
              View Orders
            </Button>
          </Link>
          <Link href="/vendor/wallet">
            <Button variant="outline" className="w-full justify-start">
              Wallet & Payouts
            </Button>
          </Link>
          <Link href="/vendor/coupons">
            <Button variant="outline" className="w-full justify-start">
              Manage Coupons
            </Button>
          </Link>
          <Link href="/vendor/reports">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
