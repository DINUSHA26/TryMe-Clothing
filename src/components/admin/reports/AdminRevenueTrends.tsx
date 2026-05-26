"use client";

import { useEffect, useState } from "react";
import { RevenueLineChart } from "@/components/reports/RevenueLineChart";

interface AdminRevenueTrendsProps {
  period: "daily" | "weekly" | "monthly";
  dateFrom: string;
  dateTo: string;
  vendorId?: string;
}

export function AdminRevenueTrends({
  period,
  dateFrom,
  dateTo,
  vendorId,
}: AdminRevenueTrendsProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          period,
          dateFrom,
          dateTo,
        });

        if (vendorId) params.append("vendorId", vendorId);

        const response = await fetch(
          `/api/admin/reports/revenue-trends?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for chart
          const chartData = result.data.labels.map((label: string, index: number) => ({
            label,
            revenue: result.data.revenue[index],
            commission: result.data.commission[index],
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch revenue trends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [period, dateFrom, dateTo, vendorId]);

  if (isLoading) {
    return (
      <RevenueLineChart
        data={[]}
        title="Revenue Trends"
        description="Loading..."
        lines={[]}
      />
    );
  }

  return (
    <RevenueLineChart
      data={data}
      title="Revenue Trends"
      description="Total revenue and commission over time"
      lines={[
        { dataKey: "revenue", name: "Revenue", color: "#10b981" },
        { dataKey: "commission", name: "Commission", color: "#3b82f6" },
      ]}
      height={350}
    />
  );
}
