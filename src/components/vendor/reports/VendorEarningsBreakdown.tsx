"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";

interface VendorEarningsBreakdownProps {
  dateFrom: string;
  dateTo: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value as number)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function VendorEarningsBreakdown({
  dateFrom,
  dateTo,
}: VendorEarningsBreakdownProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBreakdown = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          period: "monthly",
          dateFrom,
          dateTo,
        });

        const response = await fetch(
          `/api/vendor/reports/earnings-breakdown?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        if (result.success) {
          // Transform data for stacked bar chart
          const chartData = result.data.labels.map((label: string, index: number) => ({
            month: label,
            grossSales: result.data.grossSales[index],
            commission: result.data.commission[index],
            netEarnings: result.data.netEarnings[index],
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch earnings breakdown:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreakdown();
  }, [dateFrom, dateTo]);

  if (isLoading || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : "No data available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <p className="text-muted-foreground">
              {isLoading ? "Loading data..." : "No data for selected period"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Breakdown</CardTitle>
        <CardDescription>
          Monthly breakdown of gross sales, commission, and net earnings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="grossSales"
              name="Gross Sales"
              fill="#3b82f6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="commission"
              name="Commission"
              fill="#ef4444"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="netEarnings"
              name="Net Earnings"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Custom HTML Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#3b82f6]" />
            <span className="text-muted-foreground font-medium">Gross Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#ef4444]" />
            <span className="text-muted-foreground font-medium">Commission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#10b981]" />
            <span className="text-muted-foreground font-medium">Net Earnings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
