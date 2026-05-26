"use client";

import { useEffect, useState } from "react";
import { PieChartCard } from "@/components/reports/PieChartCard";
import { CHART_COLORS } from "@/lib/utils/chartHelpers";

interface AdminOrderDistributionProps {
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
}

export function AdminOrderDistribution({
  dateFrom,
  dateTo,
  vendorId,
}: AdminOrderDistributionProps) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (vendorId) params.append("vendorId", vendorId);

        const response = await fetch(
          `/api/admin/reports/order-distribution?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for pie chart
          const chartData = Object.entries(result.data)
            .filter(([, count]) => (count as number) > 0)
            .map(([status, count]) => ({
              name: status.replace(/_/g, " "),
              value: count as number,
            }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch order distribution:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistribution();
  }, [dateFrom, dateTo, vendorId]);

  if (isLoading) {
    return (
      <PieChartCard
        data={[]}
        title="Order Status Distribution"
        description="Loading..."
      />
    );
  }

  return (
    <PieChartCard
      data={data}
      title="Order Status Distribution"
      description="Orders grouped by status"
      colors={Object.values(CHART_COLORS.status)}
      height={300}
    />
  );
}
