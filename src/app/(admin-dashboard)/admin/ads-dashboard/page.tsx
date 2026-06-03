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
  Loader2
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

  // Formatting active plan distribution for PieChartCard
  const planDistributionData = [
    { name: "Free", value: stats.activePlansDistribution.FREE },
    { name: "Basic", value: stats.activePlansDistribution.BASIC },
    { name: "Pro", value: stats.activePlansDistribution.PRO },
    { name: "Premium", value: stats.activePlansDistribution.PREMIUM },
  ];

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
        {/* Active Plans Breakdown */}
        <PieChartCard
          data={planDistributionData}
          title="Active Subscriptions by Plan"
          description="Breakdown of currently active plans across all marketplace sellers."
          colors={["#A0AEC0", "#4FD1C5", "#3182CE", "#805AD5"]}
          height={280}
        />

        {/* Plan Revenues Breakdown */}
        <BarChartCard
          data={planRevenueData}
          xKey="plan"
          yKey="revenue"
          title="Revenues by Plan Type"
          description="Total revenue accumulated per classified pricing tier."
          color="#3182CE"
          height={280}
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
