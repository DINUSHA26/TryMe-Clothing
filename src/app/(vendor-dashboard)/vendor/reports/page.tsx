"use client";

import { useState } from "react";
import { VendorOverviewStats } from "@/components/vendor/reports/VendorOverviewStats";
import { VendorSalesTrends } from "@/components/vendor/reports/VendorSalesTrends";
import { VendorOrderDistribution } from "@/components/vendor/reports/VendorOrderDistribution";
import { VendorTopProducts } from "@/components/vendor/reports/VendorTopProducts";
import { VendorEarningsBreakdown } from "@/components/vendor/reports/VendorEarningsBreakdown";
import { DateRangeSelector } from "@/components/reports/DateRangeSelector";
import { ExportButton } from "@/components/reports/ExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForAPI, getDateRangeByPreset } from "@/lib/utils/dateRange";
import { BarChart3 } from "lucide-react";

export default function VendorReportsPage() {
  // Initialize with last 30 days
  const initialRange = getDateRangeByPreset("30d");
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);

    // Auto-adjust period based on range
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      setPeriod("monthly");
    } else if (diffDays > 31) {
      setPeriod("weekly");
    } else {
      setPeriod("daily");
    }
  };

  const dateFromStr = formatDateForAPI(dateFrom);
  const dateToStr = formatDateForAPI(dateTo);

  const handleExport = async () => {
    const response = await fetch("/api/vendor/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: "sales", filters: { dateFrom: dateFromStr, dateTo: dateToStr } }),
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-report-${dateFromStr}-${dateToStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Sales Reports & Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Track your sales performance and business insights
          </p>
        </div>
        <ExportButton onExport={handleExport} filename="vendor-report" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Date Range</Label>
              <DateRangeSelector
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={handleDateRangeChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period" className="mb-2 block">
                  Trend Period
                </Label>
                <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <VendorOverviewStats dateFrom={dateFromStr} dateTo={dateToStr} />

      {/* Sales Trends */}
      <VendorSalesTrends
        period={period}
        dateFrom={dateFromStr}
        dateTo={dateToStr}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendorOrderDistribution dateFrom={dateFromStr} dateTo={dateToStr} />
        <VendorTopProducts dateFrom={dateFromStr} dateTo={dateToStr} limit={10} />
      </div>

      {/* Earnings Breakdown */}
      <VendorEarningsBreakdown dateFrom={dateFromStr} dateTo={dateToStr} />
    </div>
  );
}
