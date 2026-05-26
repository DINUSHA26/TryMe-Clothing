"use client";

import { useEffect, useState } from "react";
import { PieChartCard } from "@/components/reports/PieChartCard";
import { CHART_COLORS } from "@/lib/utils/chartHelpers";

interface VendorOrderDistributionProps {
  dateFrom?: string;
  dateTo?: string;
}

export function VendorOrderDistribution({
  dateFrom,
  dateTo,
}: VendorOrderDistributionProps) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/vendor/reports/order-distribution?${params.toString()}`,
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
  }, [dateFrom, dateTo]);

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
      description="Your orders grouped by status"
      colors={Object.values(CHART_COLORS.status)}
      height={300}
    />
  );
}
