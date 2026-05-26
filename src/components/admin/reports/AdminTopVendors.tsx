"use client";

import { useEffect, useState } from "react";
import { BarChartCard } from "@/components/reports/BarChartCard";

interface AdminTopVendorsProps {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export function AdminTopVendors({
  dateFrom,
  dateTo,
  limit = 10,
}: AdminTopVendorsProps) {
  const [data, setData] = useState<Array<{ name: string; revenue: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopVendors = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/admin/reports/top-vendors?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for bar chart
          const chartData = result.data.map((vendor: any) => ({
            name: vendor.businessName,
            revenue: vendor.totalRevenue,
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch top vendors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopVendors();
  }, [dateFrom, dateTo, limit]);

  if (isLoading) {
    return (
      <BarChartCard
        data={[]}
        title="Top Vendors by Revenue"
        description="Loading..."
        xKey="name"
        yKey="revenue"
      />
    );
  }

  return (
    <BarChartCard
      data={data}
      title="Top Vendors by Revenue"
      description={`Top ${limit} performing vendors`}
      xKey="name"
      yKey="revenue"
      color="#8b5cf6"
      height={300}
      sortData={false}
    />
  );
}
