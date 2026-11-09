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
import { Trash2, Eye, LayoutGrid, PlusCircle, RefreshCw, Edit, Barcode, Sparkles } from "lucide-react";
import { BarcodeGeneratorModal } from "@/components/products/BarcodeGeneratorModal";
import { AiSocialPostModal } from "@/components/ai/AiSocialPostModal";
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

  const handleToggleChannel = async (adId: string, channel: "website" | "marketplace" | "pos", currentValue: boolean) => {
    const field = channel === "website" ? "showOnWebsite" : channel === "marketplace" ? "showOnMarketplace" : "showOnPos";
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

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Failed to update channel (Status ${response.status})`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result?.error || "Failed to update channel");
      }

      toast({
        title: "Channel Visibility Updated",
        description: `${channel === "website" ? "My Website" : channel === "marketplace" ? "Marketplace" : "In-Store POS"} visibility is now ${nextVal ? "ON" : "OFF"}.`,
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
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
            <SelectTrigger className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-xl">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
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
          className="text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white flex items-center gap-1"
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
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-card dark:bg-slate-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-slate-800/60 dark:border-slate-800">
                <TableHead className="dark:text-slate-300">Listing</TableHead>
                <TableHead className="dark:text-slate-300">Category</TableHead>
                <TableHead className="dark:text-slate-300">Location</TableHead>
                <TableHead className="dark:text-slate-300">Price</TableHead>
                <TableHead className="min-w-[220px] dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">Posted</TableHead>
                <TableHead className="dark:text-slate-300">Views</TableHead>
                <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.length === 0 ? (
                <TableRow className="dark:border-slate-800">
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No ads found. Get started by posting your first classified ad!
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad: any) => (
                  <TableRow key={ad.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/40 dark:border-slate-800">
                    <TableCell className="font-semibold text-gray-900 dark:text-white max-w-[240px] truncate">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shrink-0 overflow-hidden relative">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-[10px] text-gray-400 dark:text-slate-500">No Image</span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white block truncate">{ad.title}</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal block truncate">ID: {ad.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-gray-800 dark:text-slate-200 font-medium">
                        {ad.category?.icon && (ad.category.icon.startsWith("/") || ad.category.icon.startsWith("http")) ? (
                          <img src={ad.category.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
                        ) : (
                          <span>{ad.category?.icon}</span>
                        )}
                        <span>{ad.category?.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-400">{ad.subCategory?.name}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-slate-300">
                      <span>{ad.district}</span>
                      {ad.localArea && <span className="text-xs text-gray-400 dark:text-slate-400 block">{ad.localArea}</span>}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      {ad.price ? `Rs. ${Number(ad.price).toLocaleString("en-LK")}` : "Contact"}
                      {ad.priceNegotiable && <span className="text-[9px] font-normal text-gray-400 dark:text-slate-400 block">Negotiable</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[220px]">
                      <div className="flex flex-col gap-1.5">
                        {/* 🌐 My Website Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap w-[96px] shrink-0 flex items-center gap-1">
                            <span>🌐</span>
                            <span className="font-semibold text-gray-700 dark:text-slate-300">My Website:</span>
                          </span>
                          {ad.showOnWebsite === false ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "website", false)}
                              title="Click to enable on My Website"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 text-[10px] font-medium py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Off (Hidden)
                              </Badge>
                            </button>
                          ) : ad.status === "ACTIVE" || ad.status === "PENDING" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "website", true)}
                              title="Click to hide from My Website"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:border-red-200 dark:group-hover:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Live
                              </Badge>
                            </button>
                          ) : ad.status === "REJECTED" ? (
                            <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              Hidden
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              {ad.status}
                            </Badge>
                          )}
                        </div>

                        {/* 🛒 TryMe Marketplace Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap w-[96px] shrink-0 flex items-center gap-1">
                            <span>🛒</span>
                            <span className="font-semibold text-gray-700 dark:text-slate-300">Marketplace:</span>
                          </span>
                          {ad.showOnMarketplace === false ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", false)}
                              title="Click to enable on TryMe Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/40 group-hover:text-orange-700 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-800 text-[10px] font-medium py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Off (Hidden)
                              </Badge>
                            </button>
                          ) : ad.status === "PENDING" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", true)}
                              title="Click to hide from Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:border-red-200 dark:group-hover:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Pending Approval
                              </Badge>
                            </button>
                          ) : ad.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "marketplace", true)}
                              title="Click to hide from Marketplace"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:border-red-200 dark:group-hover:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Live
                              </Badge>
                            </button>
                          ) : ad.status === "REJECTED" ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                                Rejected
                              </Badge>
                              {ad.rejectionReason && (
                                <span className="text-[9px] text-red-500 max-w-[120px] truncate" title={ad.rejectionReason}>
                                  ({ad.rejectionReason})
                                </span>
                              )}
                            </div>
                          ) : ad.status === "EXPIRED" ? (
                            <Badge variant="outline" className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0">
                              {ad.status}
                            </Badge>
                          )}
                        </div>

                        {/* 📟 POS Counter Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap w-[96px] shrink-0 flex items-center gap-1">
                            <span>📟</span>
                            <span className="font-semibold text-gray-700 dark:text-slate-300">POS Counter:</span>
                          </span>
                          {ad.showOnPos === false ? (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "pos", false)}
                              title="Click to enable on In-Store POS"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/40 group-hover:text-purple-700 dark:group-hover:text-purple-400 group-hover:border-purple-200 dark:group-hover:border-purple-800 text-[10px] font-medium py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Off (Hidden)
                              </Badge>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleChannel(ad.id, "pos", true)}
                              title="Click to hide from In-Store POS"
                              className="cursor-pointer group"
                            >
                              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:border-red-200 dark:group-hover:border-red-800 text-[10px] font-bold py-0.5 px-2.5 h-auto whitespace-nowrap shrink-0 transition-colors">
                                Live
                              </Badge>
                            </button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistance(new Date(ad.createdAt), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      {ad.views}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ad.status === "ACTIVE" && (
                          <Button variant="ghost" size="icon" asChild title="View on Marketplace" className="dark:hover:bg-slate-800">
                            <a href={`/marketplace/${ad.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-4.5 w-4.5 text-gray-500 dark:text-slate-400" />
                            </a>
                          </Button>
                        )}
                        <AiSocialPostModal
                          item={{
                            type: "AD",
                            id: ad.id,
                            name: ad.title,
                            price: Number(ad.price || 0),
                            category: ad.primaryCategory || "Classified Ad",
                            description: ad.description,
                            imageUrl: ad.images?.[0],
                            specifications: ad.specifications,
                            location: [ad.locationCity, ad.locationDistrict].filter(Boolean).join(", "),
                          }}
                          triggerButton={
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Generate AI Facebook & Instagram Posts"
                              className="text-amber-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg"
                            >
                              <Sparkles className="h-4.5 w-4.5" />
                            </Button>
                          }
                        />
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
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
                            >
                              <Barcode className="h-4.5 w-4.5" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" asChild title="Edit Ad" className="dark:hover:bg-slate-800">
                          <Link href={`/ads-seller/edit-ad/${ad.id}`}>
                            <Edit className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={deletingId === ad.id}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} ads total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
