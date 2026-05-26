"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/reports/StatCard";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface OverviewStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  totalCommission: number;
  activeVendors: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface AdminOverviewStatsProps {
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
}

export function AdminOverviewStats({
  dateFrom,
  dateTo,
  vendorId,
}: AdminOverviewStatsProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (vendorId) params.append("vendorId", vendorId);

        const response = await fetch(
          `/api/admin/reports/overview?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch overview stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateFrom, dateTo, vendorId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        label="Total Revenue"
        value={stats ? formatCurrency(stats.totalRevenue) : "-"}
        icon={DollarSign}
        color="green"
        isLoading={isLoading}
        description="All-time platform revenue"
      />

      <StatCard
        label="This Month Revenue"
        value={stats ? formatCurrency(stats.thisMonthRevenue) : "-"}
        icon={TrendingUp}
        color="blue"
        isLoading={isLoading}
        description="Current month earnings"
      />

      <StatCard
        label="Total Commission"
        value={stats ? formatCurrency(stats.totalCommission) : "-"}
        icon={CreditCard}
        color="purple"
        isLoading={isLoading}
        description="Platform commission earned"
      />

      <StatCard
        label="Active Vendors"
        value={stats ? stats.activeVendors.toString() : "-"}
        icon={Users}
        color="orange"
        isLoading={isLoading}
        description="Active vendor accounts"
      />

      <StatCard
        label="Total Orders"
        value={stats ? stats.totalOrders.toLocaleString() : "-"}
        icon={ShoppingCart}
        color="blue"
        isLoading={isLoading}
        description="Total successful orders"
      />

      <StatCard
        label="Average Order Value"
        value={stats ? formatCurrency(stats.averageOrderValue) : "-"}
        icon={Package}
        color="yellow"
        isLoading={isLoading}
        description="Mean order amount"
      />
    </div>
  );
}
