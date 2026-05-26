"use client";

import { useEffect, useState } from "react";
import { PieChartCard } from "@/components/reports/PieChartCard";
import { CHART_COLORS } from "@/lib/utils/chartHelpers";

interface AdminPaymentMethodsProps {
  dateFrom?: string;
  dateTo?: string;
}

export function AdminPaymentMethods({
  dateFrom,
  dateTo,
}: AdminPaymentMethodsProps) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/admin/reports/payment-methods?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for pie chart
          const chartData = Object.entries(result.data)
            .filter(([, count]) => (count as number) > 0)
            .map(([method, count]) => ({
              name: method,
              value: count as number,
            }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [dateFrom, dateTo]);

  if (isLoading) {
    return (
      <PieChartCard
        data={[]}
        title="Payment Methods"
        description="Loading..."
      />
    );
  }

  return (
    <PieChartCard
      data={data}
      title="Payment Methods"
      description="Payment distribution by card type"
      colors={Object.values(CHART_COLORS.payment)}
      height={300}
    />
  );
}
