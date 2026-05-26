"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { AdminOverviewStats } from "@/components/admin/reports/AdminOverviewStats";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
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
        <Link href="/admin/reports">
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Full Reports
          </Button>
        </Link>
      </div>

      {/* Stats Grid - Real Data */}
      <AdminOverviewStats />

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border p-4 md:p-8">
        <h2 className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/vendors">
            <Button variant="outline" className="w-full justify-start">
              Manage Vendors
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" className="w-full justify-start">
              View All Orders
            </Button>
          </Link>
          <Link href="/admin/disputes">
            <Button variant="outline" className="w-full justify-start">
              Handle Disputes
            </Button>
          </Link>
          <Link href="/admin/payouts">
            <Button variant="outline" className="w-full justify-start">
              Process Payouts
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="outline" className="w-full justify-start">
              Manage Coupons
            </Button>
          </Link>
          <Link href="/admin/reports">
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
