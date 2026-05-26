"use client";

import { useEffect, useState } from "react";
import { BarChartCard } from "@/components/reports/BarChartCard";

interface AdminRevenueByCategoryProps {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export function AdminRevenueByCategory({
  dateFrom,
  dateTo,
  limit = 10,
}: AdminRevenueByCategoryProps) {
  const [data, setData] = useState<Array<{ name: string; revenue: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueByCategory = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/admin/reports/revenue-by-category?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for bar chart
          const chartData = result.data.map((category: any) => ({
            name: category.name,
            revenue: category.totalRevenue,
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch revenue by category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueByCategory();
  }, [dateFrom, dateTo, limit]);

  if (isLoading) {
    return (
      <BarChartCard
        data={[]}
        title="Revenue by Category"
        description="Loading..."
        xKey="name"
        yKey="revenue"
      />
    );
  }

  return (
    <BarChartCard
      data={data}
      title="Revenue by Category"
      description={`Top ${limit} categories by revenue`}
      xKey="name"
      yKey="revenue"
      color="#10b981"
      height={300}
      sortData={false}
    />
  );
}
