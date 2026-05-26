"use client";

import { useState } from "react";
import { AdminOverviewStats } from "@/components/admin/reports/AdminOverviewStats";
import { AdminRevenueTrends } from "@/components/admin/reports/AdminRevenueTrends";
import { AdminOrderDistribution } from "@/components/admin/reports/AdminOrderDistribution";
import { AdminTopVendors } from "@/components/admin/reports/AdminTopVendors";
import { AdminRevenueByCategory } from "@/components/admin/reports/AdminRevenueByCategory";
import { AdminPaymentMethods } from "@/components/admin/reports/AdminPaymentMethods";
import { DateRangeSelector } from "@/components/reports/DateRangeSelector";
import { ExportButton } from "@/components/reports/ExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForAPI, getDateRangeByPreset } from "@/lib/utils/dateRange";
import { BarChart3 } from "lucide-react";

export default function AdminReportsPage() {
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
    const response = await fetch("/api/admin/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: "sales", filters: { dateFrom: dateFromStr, dateTo: dateToStr } }),
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${dateFromStr}-${dateToStr}.csv`;
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
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive platform performance metrics and insights
          </p>
        </div>
        <ExportButton onExport={handleExport} filename="admin-report" />
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
      <AdminOverviewStats dateFrom={dateFromStr} dateTo={dateToStr} />

      {/* Revenue Trends */}
      <AdminRevenueTrends
        period={period}
        dateFrom={dateFromStr}
        dateTo={dateToStr}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminOrderDistribution dateFrom={dateFromStr} dateTo={dateToStr} />
        <AdminPaymentMethods dateFrom={dateFromStr} dateTo={dateToStr} />
      </div>

      {/* Top Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminTopVendors dateFrom={dateFromStr} dateTo={dateToStr} limit={10} />
        <AdminRevenueByCategory dateFrom={dateFromStr} dateTo={dateToStr} limit={10} />
      </div>
    </div>
  );
}
