"use client";

import { useEffect, useState } from "react";
import { RevenueLineChart } from "@/components/reports/RevenueLineChart";

interface VendorSalesTrendsProps {
  period: "daily" | "weekly" | "monthly";
  dateFrom: string;
  dateTo: string;
}

export function VendorSalesTrends({
  period,
  dateFrom,
  dateTo,
}: VendorSalesTrendsProps) {
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

        const response = await fetch(
          `/api/vendor/reports/sales-trends?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for chart
          const chartData = result.data.labels.map((label: string, index: number) => ({
            label,
            grossSales: result.data.grossSales[index],
            netEarnings: result.data.netEarnings[index],
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch sales trends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [period, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <RevenueLineChart
        data={[]}
        title="Sales Trends"
        description="Loading..."
        lines={[]}
      />
    );
  }

  return (
    <RevenueLineChart
      data={data}
      title="Sales Trends"
      description="Gross sales and net earnings over time"
      lines={[
        { dataKey: "grossSales", name: "Gross Sales", color: "#3b82f6" },
        { dataKey: "netEarnings", name: "Net Earnings", color: "#10b981" },
      ]}
      height={350}
    />
  );
}
