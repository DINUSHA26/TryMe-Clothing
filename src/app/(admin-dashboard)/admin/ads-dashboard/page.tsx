"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Users, 
  Megaphone, 
  Eye, 
  CreditCard, 
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/reports/StatCard";
import { PieChartCard } from "@/components/reports/PieChartCard";
import { BarChartCard } from "@/components/reports/BarChartCard";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface AdsStats {
  totalRevenue: number;
  totalPaymentsCount: number;
  activeSubscriptionsCount: number;
  activePlansDistribution: {
    FREE: number;
    BASIC: number;
    PRO: number;
    PREMIUM: number;
  };
  revenueByPlanType: {
    FREE: number;
    BASIC: number;
    PRO: number;
    PREMIUM: number;
  };
  totalClassifiedAds: number;
  activeClassifiedAds: number;
  pendingClassifiedAds: number;
  totalSellers: number;
  activeSellers: number;
  totalAdsViews: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    planName: string;
    planType: string;
    sellerName: string;
  }>;
}

export default function AdminAdsDashboardPage() {
  const [stats, setStats] = useState<AdsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/reports/ads-overview");
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch ads stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6600] mb-2" />
        <p className="text-sm">Loading Ads Dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium mb-4">Failed to load marketplace statistics.</p>
        <Button onClick={fetchStats} className="bg-[#FF6600] hover:bg-[#FF6600]/90">
          Try Again
        </Button>
      </div>
    );
  }

  // Formatting active plan distribution data
  const planDistributionData = [
    { name: "Free", value: stats.activePlansDistribution.FREE },
    { name: "Basic", value: stats.activePlansDistribution.BASIC },
    { name: "Pro", value: stats.activePlansDistribution.PRO },
    { name: "Premium", value: stats.activePlansDistribution.PREMIUM },
  ];

  const planColors = ["#94A3B8", "#14B8A6", "#3B82F6", "#8B5CF6"];

  const freeCount = stats.activePlansDistribution.FREE;
  const paidCount =
    stats.activePlansDistribution.BASIC +
    stats.activePlansDistribution.PRO +
    stats.activePlansDistribution.PREMIUM;
  const totalSubs = stats.activeSubscriptionsCount || (freeCount + paidCount);
  const freePct = totalSubs > 0 ? ((freeCount / totalSubs) * 100).toFixed(1) : "0";
  const paidPct = totalSubs > 0 ? ((paidCount / totalSubs) * 100).toFixed(1) : "0";

  // Formatting revenue by plan data for BarChartCard
  const planRevenueData = [
    { plan: "Free", revenue: stats.revenueByPlanType.FREE },
    { plan: "Basic", revenue: stats.revenueByPlanType.BASIC },
    { plan: "Pro", revenue: stats.revenueByPlanType.PRO },
    { plan: "Premium", revenue: stats.revenueByPlanType.PREMIUM },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace & Ads Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of classified advertisement revenues, plan subscriptions, and seller metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ads-plan-payments">
            <Button variant="outline" className="border-gray-200">
              Plan Payments
            </Button>
          </Link>
          <Link href="/admin/marketplace">
            <Button className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white">
              Manage Ads
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Ad Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
          description="Total plan subscription income"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptionsCount}
          icon={CreditCard}
          color="blue"
          description="Sellers currently on paid/free plans"
        />
        <StatCard
          label="Active Classified Ads"
          value={`${stats.activeClassifiedAds} / ${stats.totalClassifiedAds}`}
          icon={LayoutGrid}
          color="orange"
          description={`${stats.pendingClassifiedAds} ads awaiting approval`}
        />
        <StatCard
          label="Verified Sellers"
          value={`${stats.activeSellers} / ${stats.totalSellers}`}
          icon={Users}
          color="purple"
          description="Sellers registered on marketplace"
        />
        <StatCard
          label="Classified Views"
          value={stats.totalAdsViews.toLocaleString()}
          icon={Eye}
          color="yellow"
          description="Total traffic on classified ads"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Plans Breakdown Card */}
        <Card className="border-gray-150 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold">Active Subscriptions by Plan</CardTitle>
                <CardDescription>Breakdown of currently active plans across all marketplace sellers.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-bold py-1 px-2.5 bg-orange-50 text-orange-700 border-orange-200 w-fit">
                Total: {totalSubs} Subscriptions
              </Badge>
            </div>

            {/* Quick Summary Pill Bar: Free vs Paid */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Free Plan</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-200">
                  {freeCount}{" "}
                  <span className="text-xs font-normal text-muted-foreground">({freePct}%)</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Paid Plans</span>
                <span className="text-base font-black text-emerald-800 dark:text-emerald-300">
                  {paidCount}{" "}
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">({paidPct}%)</span>
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Pie Chart */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistributionData.map(d => ({ ...d, total: totalSubs }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={36}
                    paddingAngle={3}
                    label={({ percent }: any) => (percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                    labelLine={false}
                  >
                    {planDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={planColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0];
                        const count = d.value as number;
                        const pct = totalSubs > 0 ? ((count / totalSubs) * 100).toFixed(1) : "0";
                        return (
                          <div className="bg-background border rounded-xl shadow-lg p-2.5 text-xs">
                            <p className="font-bold text-foreground">{d.name} Plan</p>
                            <p className="text-muted-foreground mt-0.5">
                              Subscribers: <span className="font-bold text-foreground">{count} sellers</span> ({pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Plan Breakdown List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t text-xs">
              {planDistributionData.map((item, idx) => {
                const pct = totalSubs > 0 ? ((item.value / totalSubs) * 100).toFixed(0) : "0";
                return (
                  <div key={item.name} className="flex flex-col items-center p-2 rounded-xl bg-muted/40 text-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planColors[idx] }} />
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-foreground">
                      {item.value} <span className="text-[11px] font-normal text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Plan Revenues Breakdown */}
        <BarChartCard
          data={planRevenueData}
          xKey="plan"
          yKey="revenue"
          title="Revenues by Plan Type"
          description="Total revenue accumulated per classified pricing tier."
          color="#3182CE"
          height={320}
          valueType="currency"
        />
      </div>

      {/* Recent Payments & Audit Logs */}
      <Card className="border-gray-150">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Plan Payments</CardTitle>
            <CardDescription>Latest classified advertisement plan purchases and approvals.</CardDescription>
          </div>
          <Link href="/admin/ads-plan-payments" className="text-sm font-semibold text-[#FF6600] flex items-center gap-1 hover:underline">
            View All Payments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-semibold text-gray-900">
                        {payment.sellerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {payment.planName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {payment.status === "COMPLETED" && (
                          <Badge className="bg-green-50 text-green-600 border-green-200" variant="outline">
                            Completed
                          </Badge>
                        )}
                        {payment.status === "PENDING" && (
                          <Badge className="bg-orange-50 text-orange-600 border-orange-200" variant="outline">
                            Pending
                          </Badge>
                        )}
                        {payment.status === "PENDING_APPROVAL" && (
                          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200" variant="outline">
                            Pending Approval
                          </Badge>
                        )}
                        {payment.status === "FAILED" && (
                          <Badge className="bg-red-50 text-red-600 border-red-200" variant="outline">
                            Failed
                          </Badge>
                        )}
                        {payment.status === "REJECTED" && (
                          <Badge className="bg-red-50 text-red-600 border-red-200" variant="outline">
                            Rejected
                          </Badge>
                        )}
                        {payment.status === "REFUNDED" && (
                          <Badge className="bg-gray-50 text-gray-600 border-gray-200" variant="outline">
                            Refunded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
