"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Eye, LayoutGrid, PlusCircle, RefreshCw, Edit, Barcode } from "lucide-react";
import { BarcodeGeneratorModal } from "@/components/products/BarcodeGeneratorModal";
import Link from "next/link";
import { formatDistance } from "date-fns";

export default function MyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/ads/seller/ads?${params}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch your ads",
        });
        return;
      }

      setAds(result.data.ads);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading your ads",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [pagination.page, statusFilter]);

  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this ad? This action cannot be undone and will release a slot.")) return;

    setDeletingId(adId);
    try {
      const response = await fetch(`/api/ads/seller/ads/${adId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: result.error || "Failed to delete ad",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ad deleted successfully",
      });
      fetchAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleChannel = async (adId: string, channel: "website" | "marketplace", currentValue: boolean) => {
    const field = channel === "website" ? "showOnWebsite" : "showOnMarketplace";
    const nextVal = !currentValue;

    // Optimistic update
    setAds((prev: any[]) =>
      prev.map((ad: any) => (ad.id === adId ? { ...ad, [field]: nextVal } : ad))
    );

    try {
      const response = await fetch(`/api/ads/seller/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextVal }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update channel");
      }

      toast({
        title: "Channel Visibility Updated",
        description: `${channel === "website" ? "My Website" : "Marketplace"} visibility is now ${nextVal ? "ON" : "OFF"}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update visibility",
      });
      fetchAds(); // rollback on error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-[#FF6600]" />
            <span>My Classified Ads</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View views statistics, edit specifications, or delete your posted marketplace ads.
          </p>
        </div>
        <Button
          asChild
          className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl flex items-center gap-2 shadow-md"
        >
          <Link href="/ads-seller/post-ad">
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Post an Ad</span>
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <SelectTrigger className="bg-white rounded-xl">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ads</SelectItem>
              <SelectItem value="PENDING">Pending Moderation</SelectItem>
              <SelectItem value="ACTIVE">Active / Live</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAds}
          className="text-gray-500 hover:text-black flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Table view */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
            <p className="text-sm">Loading your ads...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Listing</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="min-w-[220px]">Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No ads found. Get started by posting your first classified ad!
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad: any) => (
                  <TableRow key={ad.id} className="hover:bg-gray-50/30">
                    <TableCell className="font-semibold text-gray-900 max-w-[240px] truncate">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 border border-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-[10px] text-gray-400">No Image</span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-sm text-gray-900 block truncate">{ad.title}</span>
                          <span className="text-[10px] text-gray-400 font-normal block truncate">ID: {ad.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-gray-800 font-medium">
                        {ad.category?.icon && (ad.category.icon.startsWith("/") || ad.category.icon.startsWith("http")) ? (
                          <img src={ad.category.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
                        ) : (
                          <span>{ad.category?.icon}</span>
                        )}
                        <span>{ad.category?.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{ad.subCategory?.name}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <span>{ad.district}</span>
                      {ad.localArea && <span className="text-xs text-gray-400 block">{ad.localArea}</span>}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">
                      {ad.price ? `Rs. ${Number(ad.price).toLocaleString("en-LK")}` : "Contact"}
                      {ad.priceNegotiable && <span className="text-[9px] font-normal text-gray-400 block">Negotiable</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[220px]">
                      <div className="flex flex-col gap-1.5">
                        {/* 🌐 My Website Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap w-[96px] shrink-0 flex items-center gap-1">
                            <span>🌐</span>
                            <span className="font-semibold text-gray-700">My Website:</span>
                          </span>
                          {ad.showOnWebsite === false ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "website", false)}
                              title="Click to enable on My Website"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 text-[10px] font-medium py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Off (Hidden)
                              </Badge>
                            </button>
                          ) : ad.status === "ACTIVE" || ad.status === "PENDING" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "website", true)}
                              title="Click to hide from My Website"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Live
                              </Badge>
                            </button>
                          ) : ad.status === "REJECTED" ? (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              Hidden
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              {ad.status}
                            </Badge>
                          )}
                        </div>

                        {/* 🛒 TryMe Marketplace Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap w-[96px] shrink-0 flex items-center gap-1">
                            <span>🛒</span>
                            <span className="font-semibold text-gray-700">Marketplace:</span>
                          </span>
                          {ad.showOnMarketplace === false ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", false)}
                              title="Click to enable on TryMe Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:border-orange-200 text-[10px] font-medium py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Off (Hidden)
                              </Badge>
                            </button>
                          ) : ad.status === "PENDING" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", true)}
                              title="Click to hide from Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Pending Approval
                              </Badge>
                            </button>
                          ) : ad.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", true)}
                              title="Click to hide from Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Live
                              </Badge>
                            </button>
                          ) : ad.status === "REJECTED" ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                                Rejected
                              </Badge>
                              {ad.rejectionReason && (
                                <span className="text-[9px] text-red-500 max-w-[120px] truncate" title={ad.rejectionReason}>
                                  ({ad.rejectionReason})
                                </span>
                              )}
                            </div>
                          ) : ad.status === "EXPIRED" ? (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              {ad.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistance(new Date(ad.createdAt), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">
                      {ad.views}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ad.status === "ACTIVE" && (
                          <Button variant="ghost" size="icon" asChild title="View on Marketplace">
                            <a href={`/marketplace/${ad.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-4.5 w-4.5 text-gray-500" />
                            </a>
                          </Button>
                        )}
                        <BarcodeGeneratorModal
                          product={{
                            id: ad.id,
                            name: ad.title,
                            sku: ad.specifications?.sku || `AD-${ad.id.slice(-6).toUpperCase()}`,
                            price: Number(ad.price || 0),
                            stock: ad.specifications?.stock || 10,
                          }}
                          storeName="My Ads Store"
                          triggerButton={
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Generate Barcode & Print Labels"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                            >
                              <Barcode className="h-4.5 w-4.5" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" asChild title="Edit Ad">
                          <Link href={`/ads-seller/edit-ad/${ad.id}`}>
                            <Edit className="h-4.5 w-4.5 text-blue-500 hover:text-blue-600" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={deletingId === ad.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Ad"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination controls */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} ads total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors bg-white text-gray-900"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors bg-white text-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
