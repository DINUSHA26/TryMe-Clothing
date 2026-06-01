"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone,
  Eye,
  CreditCard,
  PlusCircle,
  LayoutGrid,
  Store,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { formatDistance } from "date-fns";

export default function AdsSellerDashboardHome() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ads/seller/dashboard");
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load dashboard metrics",
        });
        return;
      }
      setData(result.data);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while fetching metrics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    activeAdsCount: 0,
    pendingAdsCount: 0,
    totalViews: 0,
    planName: "Free Plan",
    adsUsed: 0,
    maxAds: 3,
  };
  const recentAds = data?.recentAds || [];
  const sellerName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Seller";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-5 pointer-events-none translate-x-12 translate-y-6 text-[#FF6600]">
          <Megaphone className="h-64 w-64 rotate-12" />
        </div>
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
            Welcome back, {sellerName}!
          </h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
            Manage your classified listings, track views, and update your mini-website storefront profile from here.
          </p>
        </div>
        <Button
          asChild
          className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg relative z-10 transition-transform active:scale-95"
        >
          <Link href="/ads-seller/post-ad">
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Post an Ad</span>
          </Link>
        </Button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Active Listings
            </CardTitle>
            <Megaphone className="h-4.5 w-4.5 text-green-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-gray-900">{stats.activeAdsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Live on the public marketplace</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Pending Moderation
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-orange-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-gray-900">{stats.pendingAdsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting administrative approval</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Total Page Views
            </CardTitle>
            <Eye className="h-4.5 w-4.5 text-[#FF6600]" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-gray-900">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative views across all ads</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Pricing Tier
            </CardTitle>
            <CreditCard className="h-4.5 w-4.5 text-purple-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-lg font-black text-gray-950 truncate">{stats.planName}</div>
            <Badge variant="outline" className="bg-[#FF6600]/10 text-[#FF6600] border-none font-bold mt-1 text-[10px]">
              {stats.adsUsed} / {stats.maxAds} Slots Used
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Limits card */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#FF6600]" />
              <span>Listing Slots Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-500">Plan limit usage</span>
                <span className="text-gray-900">{stats.adsUsed} of {stats.maxAds} ads posted</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#FF6600] to-[#ff8000] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((stats.adsUsed / stats.maxAds) * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Once you hit your slot limit, you cannot post new ads. Upgrade your plan to enjoy larger limits and premium visibility options.
            </p>
            <Button asChild variant="outline" className="w-full border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl">
              <Link href="/ads-seller/plans">
                Upgrade Listing Limits
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>Quick Administrative Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/ads-seller/post-ad"
              className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-orange-100 hover:bg-orange-50/20 text-center gap-2 group transition-all"
            >
              <PlusCircle className="h-6 w-6 text-[#FF6600] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Post New Ad</span>
            </Link>
            <Link
              href="/ads-seller/my-ads"
              className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-orange-100 hover:bg-orange-50/20 text-center gap-2 group transition-all"
            >
              <LayoutGrid className="h-6 w-6 text-[#FF6600] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Manage Listings</span>
            </Link>
            <Link
              href="/ads-seller/plans"
              className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-orange-100 hover:bg-orange-50/20 text-center gap-2 group transition-all"
            >
              <CreditCard className="h-6 w-6 text-[#FF6600] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Pricing Tiers</span>
            </Link>
            <Link
              href="/ads-seller/storefront"
              className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-orange-100 hover:bg-orange-50/20 text-center gap-2 group transition-all"
            >
              <Store className="h-6 w-6 text-[#FF6600] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Customize Store</span>
            </Link>
            {user?.adsSeller?.slug && (
              <a
                href={`/marketplace/sellers/${user.adsSeller.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:border-orange-100 hover:bg-orange-50/20 text-center gap-2 group transition-all col-span-2 md:col-span-2"
              >
                <Store className="h-6 w-6 text-purple-600 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-semibold text-gray-800">View Public Shop</span>
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-800">
            Recent Classified Listings
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs text-[#FF6600] hover:text-[#e65c00]">
            <Link href="/ads-seller/my-ads">
              View All Ads
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Listing Detail</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No ads created yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentAds.map((ad: any) => (
                  <TableRow key={ad.id} className="hover:bg-gray-50/30">
                    <TableCell className="font-semibold text-gray-900 max-w-[240px] truncate">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 border rounded-lg shrink-0 overflow-hidden relative">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-[9px] text-gray-400">No Img</span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-sm text-gray-900 block truncate">{ad.title}</span>
                          <span className="text-[10px] text-gray-400 font-normal">ID: {ad.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ad.subCategory?.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{ad.district}</span>
                        {ad.localArea && <span className="text-xs text-gray-400">({ad.localArea})</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">
                      {ad.price ? `Rs. ${Number(ad.price).toLocaleString("en-LK")}` : "Contact"}
                    </TableCell>
                    <TableCell>
                      {ad.status === "PENDING" && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Pending</Badge>}
                      {ad.status === "ACTIVE" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Active</Badge>}
                      {ad.status === "REJECTED" && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>}
                      {ad.status === "EXPIRED" && <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Expired</Badge>}
                      {ad.status === "PAUSED" && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Paused</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistance(new Date(ad.createdAt), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-700">
                      {ad.views}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
