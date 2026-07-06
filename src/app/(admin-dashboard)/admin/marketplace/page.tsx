"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceAdsTable } from "@/components/admin/ads/MarketplaceAdsTable";
import { Button } from "@/components/ui/button";
import { SL_LOCATIONS } from "@/lib/ads-locations";

export default function AdminMarketplacePage() {
  const [ads, setAds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  
  const [minPrice, setMinPrice] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");
  
  const [dateFilter, setDateFilter] = useState("any");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { toast } = useToast();
  const districts = Object.keys(SL_LOCATIONS);

  // Debouncing handlers
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
    }, 400);
    return () => clearTimeout(handler);
  }, [minPrice]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaxPrice(maxPrice);
    }, 400);
    return () => clearTimeout(handler);
  }, [maxPrice]);

  // Load filter options (categories and sellers) on mount
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const catRes = await fetch("/api/ads/public/categories");
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.data || []);
        }

        const selRes = await fetch("/api/admin/ads-sellers?pageSize=100");
        const selData = await selRes.json();
        if (selData.success) {
          setSellers(selData.data.sellers || []);
        }
      } catch (error) {
        console.error("Error loading filters data:", error);
      }
    };
    loadFiltersData();
  }, []);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      let finalStartDate = "";
      let finalEndDate = "";

      if (dateFilter !== "custom" && dateFilter !== "any") {
        const now = new Date();
        if (dateFilter === "today") {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          finalStartDate = today.toISOString();
        } else if (dateFilter === "week") {
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          finalStartDate = lastWeek.toISOString();
        } else if (dateFilter === "month") {
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          finalStartDate = lastMonth.toISOString();
        }
      } else if (dateFilter === "custom") {
        if (startDate) {
          finalStartDate = new Date(startDate).toISOString();
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          finalEndDate = end.toISOString();
        }
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
        ...(sellerFilter !== "all" && { sellerId: sellerFilter }),
        ...(locationFilter !== "all" && { location: locationFilter }),
        ...(debouncedMinPrice && { minPrice: debouncedMinPrice }),
        ...(debouncedMaxPrice && { maxPrice: debouncedMaxPrice }),
        ...(finalStartDate && { startDate: finalStartDate }),
        ...(finalEndDate && { endDate: finalEndDate }),
      });

      const response = await fetch(`/api/admin/marketplace?${params}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch classified ads",
        });
        return;
      }

      setAds(result.data.ads);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error("Error fetching classified ads:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [
    pagination.page,
    debouncedSearchQuery,
    statusFilter,
    categoryFilter,
    sellerFilter,
    locationFilter,
    debouncedMinPrice,
    debouncedMaxPrice,
    dateFilter,
    startDate,
    endDate,
  ]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setCategoryFilter("all");
    setSellerFilter("all");
    setLocationFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setDateFilter("any");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = 
    categoryFilter !== "all" ||
    sellerFilter !== "all" ||
    locationFilter !== "all" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    dateFilter !== "any" ||
    startDate !== "" ||
    endDate !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace Classified Ads</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, promote, or delete classified advertisements posted by verified Ads Sellers.
        </p>
      </div>

      {/* Filters Toggle & Search bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search ad title, seller email, or business name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="ACTIVE">Active / Published</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Filters Button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 bg-white ${showFilters ? "border-[#FF6600] text-[#FF6600] hover:text-[#FF6600]" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-2 w-2 rounded-full bg-[#FF6600]" />
          )}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seller Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</label>
              <Select
                value={sellerFilter}
                onValueChange={(value) => {
                  setSellerFilter(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Seller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  {sellers.map((sel: any) => {
                    const name = sel.businessName || `${sel.user.firstName || ""} ${sel.user.lastName || ""}`.trim() || sel.user.email;
                    return (
                      <SelectItem key={sel.id} value={sel.id}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
              <Select
                value={locationFilter}
                onValueChange={(value) => {
                  setLocationFilter(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All of Sri Lanka</SelectItem>
                  {districts.map((d: string) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price Range (Rs.)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="bg-white"
                />
                <span className="text-gray-400 text-sm">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 items-end">
            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-end flex-1">
              <div className="space-y-1.5 w-full sm:w-[200px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Posted</label>
                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    setDateFilter(value);
                    if (value !== "custom") {
                      setStartDate("");
                      setEndDate("");
                    }
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="custom">Custom range...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === "custom" && (
                <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                  <div className="space-y-1 w-full font-medium text-xs text-gray-400">
                    <span className="block mb-0.5 text-gray-500">From</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1 w-full font-medium text-xs text-gray-400">
                    <span className="block mb-0.5 text-gray-500">To</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="bg-white h-9"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Clear Action */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
            <p className="text-sm">Loading classified ads...</p>
          </div>
        </div>
      ) : (
        <MarketplaceAdsTable ads={ads} onAdUpdated={fetchAds} />
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
