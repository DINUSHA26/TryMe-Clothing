"use client";

import { useEffect, useState } from "react";
import { BarChartCard } from "@/components/reports/BarChartCard";
import { Button } from "@/components/ui/button";

interface VendorTopProductsProps {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export function VendorTopProducts({
  dateFrom,
  dateTo,
  limit = 10,
}: VendorTopProductsProps) {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"revenue" | "units">("revenue");

  useEffect(() => {
    const fetchTopProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          sortBy,
        });
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const response = await fetch(
          `/api/vendor/reports/top-products?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for bar chart
          const chartData = result.data.map((product: any) => ({
            name: product.name,
            value: sortBy === "revenue" ? product.revenue : product.unitsSold,
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch top products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopProducts();
  }, [dateFrom, dateTo, limit, sortBy]);

  if (isLoading) {
    return (
      <BarChartCard
        data={[]}
        title="Top Products"
        description="Loading..."
        xKey="name"
        yKey="value"
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant={sortBy === "revenue" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("revenue")}
        >
          By Revenue
        </Button>
        <Button
          variant={sortBy === "units" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("units")}
        >
          By Units Sold
        </Button>
      </div>

      <BarChartCard
        data={data}
        title="Top Products"
        description={`Top ${limit} products by ${sortBy === "revenue" ? "revenue" : "units sold"}`}
        xKey="name"
        yKey="value"
        color={sortBy === "revenue" ? "#10b981" : "#3b82f6"}
        height={300}
        sortData={false}
        valueType={sortBy === "revenue" ? "currency" : "number"}
      />
    </div>
  );
}
