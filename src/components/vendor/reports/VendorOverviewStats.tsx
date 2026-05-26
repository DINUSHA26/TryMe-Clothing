"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/reports/StatCard";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface OverviewStats {
  totalSales: number;
  thisMonthSales: number;
  pendingBalance: number;
  availableBalance: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface VendorOverviewStatsProps {
  dateFrom?: string;
  dateTo?: string;
}

export function VendorOverviewStats({
  dateFrom,
  dateTo,
}: VendorOverviewStatsProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        label="Total Sales"
        value={stats ? formatCurrency(stats.totalSales) : "-"}
        icon={DollarSign}
        color="green"
        isLoading={isLoading}
        description="All-time sales revenue"
      />

      <StatCard
        label="This Month Sales"
        value={stats ? formatCurrency(stats.thisMonthSales) : "-"}
        icon={TrendingUp}
        color="blue"
        isLoading={isLoading}
        description="Current month earnings"
      />

      <StatCard
        label="Pending Balance"
        value={stats ? formatCurrency(stats.pendingBalance) : "-"}
        icon={Clock}
        color="yellow"
        isLoading={isLoading}
        description="Funds awaiting release"
      />

      <StatCard
        label="Available Balance"
        value={stats ? formatCurrency(stats.availableBalance) : "-"}
        icon={Wallet}
        color="purple"
        isLoading={isLoading}
        description="Ready for payout"
      />

      <StatCard
        label="Total Orders"
        value={stats ? stats.totalOrders.toLocaleString() : "-"}
        icon={ShoppingCart}
        color="blue"
        isLoading={isLoading}
        description="Total items sold"
      />

      <StatCard
        label="Average Order Value"
        value={stats ? formatCurrency(stats.averageOrderValue) : "-"}
        icon={Package}
        color="orange"
        isLoading={isLoading}
        description="Mean item price"
      />
    </div>
  );
}
