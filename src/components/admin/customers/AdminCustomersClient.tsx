"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Users,
  Search,
  Store,
  Globe,
  ScanBarcode,
  ShoppingBag,
  CreditCard,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Mail,
  Phone,
  Clock,
  ArrowUpDown,
  X,
  UserCheck,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface AdminCustomersClientProps {
  initialData?: any;
}

export function AdminCustomersClient({ initialData }: AdminCustomersClientProps) {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  // Filters state
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Active customer history modal state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource !== "all") params.set("source", selectedSource);
      if (selectedVendorId !== "all") params.set("vendorId", selectedVendorId);
      if (sortBy) params.set("sortBy", sortBy);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", String(currentPage));
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersData();
  }, [selectedSource, selectedVendorId, sortBy, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomersData();
  };

  const stats = data?.stats || {
    totalCustomers: 0,
    trymeCustomersCount: 0,
    websiteCustomersCount: 0,
    posCustomersCount: 0,
    totalPlatformSpend: 0,
  };

  const customers = data?.customers || [];
  const vendorsList = data?.vendorsList || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalCount: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            <span>Customer Panel</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified directory of buyers from TryMe.lk Marketplace, Vendor Standalone Websites, and In-Store POS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSource("all");
              setSelectedVendorId("all");
              setSortBy("recent");
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered platform users & buyers
            </p>
          </div>
        </div>

        {/* TryMe.lk Marketplace Buyers */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              TryMe.lk Buyers
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.trymeCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ordered via TryMe.lk marketplace
            </p>
          </div>
        </div>

        {/* Direct Vendor Websites Buyers */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Direct Site Buyers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.websiteCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ordered directly from shop websites
            </p>
          </div>
        </div>

        {/* POS Walk-in Customers */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              POS In-Store Buyers
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ScanBarcode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.posCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Billed through physical POS systems
            </p>
          </div>
        </div>
      </div>

      {/* Channel / Source Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setSelectedSource("all");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedSource === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All Customers ({stats.totalCustomers})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedSource("tryme");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedSource === "tryme"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>TryMe.lk Marketplace ({stats.trymeCustomersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedSource("website");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedSource === "website"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Direct Shop Websites ({stats.websiteCustomersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedSource("pos");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedSource === "pos"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanBarcode className="w-3.5 h-3.5" />
          <span>POS Walk-ins ({stats.posCustomersCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name, email, phone..."
              className="pl-9 pr-16 h-10 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchCustomersData();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
            <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 px-2.5 text-xs">
              Search
            </Button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Shop */}
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-lg border bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Shops ({vendorsList.length})</option>
              {vendorsList.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.businessName}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-lg border bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Sort: Most Recent Order</option>
              <option value="spent">Sort: Highest Total Spend</option>
              <option value="orders">Sort: Most Orders Placed</option>
              <option value="name">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Customer Directory ({pagination.totalCount})</span>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading customers...</span>}
        </div>

        {customers.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {loading ? "Loading customer list..." : "No customers found matching the selected filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Channels</th>
                  <th className="px-4 py-3 text-left">Purchased From Shops</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Lifetime Spend</th>
                  <th className="px-4 py-3 text-left">Last Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c: any) => {
                  return (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                            {c.fullName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{c.fullName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              Joined {format(new Date(c.createdAt), "MMM yyyy")}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {c.email ? (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{c.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No email</span>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.channels.includes("TRYME") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Store className="w-2.5 h-2.5" />
                              <span>TryMe</span>
                            </span>
                          )}
                          {c.channels.includes("WEBSITE") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Direct Site</span>
                            </span>
                          )}
                          {c.channels.includes("POS") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <ScanBarcode className="w-2.5 h-2.5" />
                              <span>POS</span>
                            </span>
                          )}
                          {c.channels.length === 0 && (
                            <span className="text-[10px] text-muted-foreground italic">No orders yet</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {c.stores.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {c.stores.map((st: any) => (
                              <span
                                key={st.vendorId}
                                className="inline-block px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium truncate"
                                title={`${st.vendorName} (${st.count} orders)`}
                              >
                                {st.vendorName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {c.totalOrders}
                      </td>

                      <td className="px-4 py-3 text-right font-black text-foreground text-sm">
                        Rs. {Number(c.totalSpent).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {c.lastOrderAt ? format(new Date(c.lastOrderAt), "MMM d, yyyy") : "Never"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCustomer(c)}
                          className="h-7 text-xs font-bold gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <span>Orders History</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total customers)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Orders History Modal */}
      <Dialog open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background">
          {selectedCustomer && (
            <div>
              {/* Header */}
              <div className="p-6 border-b bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                      {selectedCustomer.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground">
                        {selectedCustomer.fullName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedCustomer.email}
                          </span>
                        )}
                        {selectedCustomer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedCustomer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Lifetime Spent</div>
                    <div className="text-lg font-black text-foreground">
                      Rs. {Number(selectedCustomer.totalSpent).toLocaleString("en-LK")}
                    </div>
                  </div>
                </div>

                {/* Quick Channels breakdown */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Channels Used:</span>
                    <div className="flex gap-1.5">
                      {selectedCustomer.channels.includes("TRYME") && (
                        <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-50 text-emerald-700">
                          <Store className="w-3 h-3" /> TryMe Marketplace
                        </Badge>
                      )}
                      {selectedCustomer.channels.includes("WEBSITE") && (
                        <Badge variant="outline" className="text-[10px] gap-1 bg-indigo-50 text-indigo-700">
                          <Globe className="w-3 h-3" /> Direct Web
                        </Badge>
                      )}
                      {selectedCustomer.channels.includes("POS") && (
                        <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-700">
                          <ScanBarcode className="w-3 h-3" /> POS Walk-in
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-foreground">
                    {selectedCustomer.totalOrders} Total Orders
                  </span>
                </div>
              </div>

              {/* Order History List */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>Recent Customer Orders</span>
                </h4>

                {selectedCustomer.recentOrders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No order history recorded for this customer yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCustomer.recentOrders.map((ord: any) => {
                      return (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-xl border bg-card hover:border-primary/40 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono font-bold text-foreground">
                              <span>{ord.orderNumber}</span>
                              {ord.channel === "TRYME" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  TryMe Marketplace
                                </span>
                              )}
                              {ord.channel === "WEBSITE" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                  Vendor Direct Web
                                </span>
                              )}
                              {ord.channel === "POS" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                  POS In-Store
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>{format(new Date(ord.createdAt), "PPP 'at' p")}</span>
                              <span>•</span>
                              <span>Shops: {ord.stores.join(", ") || "General"}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <div className="font-black text-foreground text-sm">
                                Rs. {Number(ord.totalAmount).toLocaleString("en-LK")}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                                {ord.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <Link
                              href={`/admin/orders/${ord.orderNumber || ord.id}`}
                              className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                              title="View Order Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex justify-end">
                <Button size="sm" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

