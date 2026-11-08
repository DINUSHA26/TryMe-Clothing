"use client";

import React, { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  ScanBarcode,
  Search,
  Filter,
  DollarSign,
  Receipt,
  Store,
  CreditCard,
  Banknote,
  Calendar,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  ShoppingBag,
  Package,
  Clock,
  Layers,
  ArrowUpRight,
  X,
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

interface AdminPosClientProps {
  initialData?: any;
}

export function AdminPosClient({ initialData }: AdminPosClientProps) {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Active receipt view state
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<any>(null);

  const fetchPosData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVendorId !== "all") params.set("vendorId", selectedVendorId);
      if (selectedPaymentMethod !== "all") params.set("paymentMethod", selectedPaymentMethod);
      if (selectedDateRange !== "all") params.set("dateRange", selectedDateRange);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      params.set("page", String(currentPage));
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/pos?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosData();
  }, [selectedVendorId, selectedPaymentMethod, selectedDateRange, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosData();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalItemsCount: 0,
    activeVendorsWithPos: 0,
    paymentBreakdown: {
      CASH: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      OTHER: { count: 0, total: 0 },
    },
  };

  const orders = data?.orders || [];
  const vendorSales = data?.vendorSales || [];
  const vendorsList = data?.vendorsList || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalCount: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ScanBarcode className="w-8 h-8 text-primary" />
            <span>Cross-Store POS Panel</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track walk-in sales, physical store receipts, customer purchases, and revenue per shop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedVendorId("all");
              setSelectedPaymentMethod("all");
              setSelectedDateRange("all");
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
        {/* Total POS Sales */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total POS Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              Rs. {Number(stats.totalRevenue).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>In-store walk-in revenue</span>
            </p>
          </div>
        </div>

        {/* Total POS Receipts */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total POS Bills
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalItemsCount} total items sold in-store
            </p>
          </div>
        </div>

        {/* Active POS Stores */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active POS Stores
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-foreground">
              {stats.activeVendorsWithPos} <span className="text-sm font-normal text-muted-foreground">/ {vendorsList.length} shops</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shops actively billing via POS
            </p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              POS Payment Split
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Cash:
              </span>
              <span className="font-bold">
                Rs. {(stats.paymentBreakdown?.CASH?.total || 0).toLocaleString("en-LK")} ({stats.paymentBreakdown?.CASH?.count || 0})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Card:
              </span>
              <span className="font-bold">
                Rs. {(stats.paymentBreakdown?.CARD?.total || 0).toLocaleString("en-LK")} ({stats.paymentBreakdown?.CARD?.count || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Store-by-Store POS Performance Section */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span>Shop-by-Shop POS Performance</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Overview of physical in-store billing activity by individual vendor
            </p>
          </div>
          {selectedVendorId !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1.5"
              onClick={() => setSelectedVendorId("all")}
            >
              <span>Filtering by shop</span>
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendorSales.filter((v: any) => v.posOrdersCount > 0).length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No store has logged any POS sales for the selected date range yet.
            </div>
          ) : (
            vendorSales
              .filter((v: any) => v.posOrdersCount > 0)
              .map((shop: any) => {
                const isSelected = selectedVendorId === shop.vendorId;
                return (
                  <div
                    key={shop.vendorId}
                    onClick={() => {
                      setSelectedVendorId(isSelected ? "all" : shop.vendorId);
                      setCurrentPage(1);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate flex items-center gap-1.5">
                          <span>{shop.businessName}</span>
                          {isSelected && (
                            <Badge variant="default" className="text-[10px] h-4 px-1.5">
                              Active Filter
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">/{shop.slug}</p>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {shop.posOrdersCount} Bills
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Revenue</span>
                        <span className="font-bold text-foreground text-sm">
                          Rs. {Number(shop.posTotalRevenue).toLocaleString("en-LK")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Items Sold</span>
                        <span className="font-bold text-foreground text-sm">
                          {shop.posItemsCount} pcs
                        </span>
                      </div>
                    </div>

                    {shop.lastSaleAt && (
                      <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last sale: {format(new Date(shop.lastSaleAt), "MMM d, h:mm a")}</span>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search POS Bill #, customer name, phone, notes..."
              className="pl-9 pr-16 h-10 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchPosData();
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

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Store Filter Dropdown */}
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-lg border bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Stores ({vendorsList.length})</option>
              {vendorsList.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.businessName}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-lg border bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-lg border bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Payments</option>
              <option value="CASH">Cash Only</option>
              <option value="CARD">Card Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* POS Receipts & Transactions Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>POS Receipts & In-Store Bills ({pagination.totalCount})</span>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading records...</span>}
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {loading ? "Loading POS transactions..." : "No POS transactions found matching the selected filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Bill / Receipt #</th>
                  <th className="px-4 py-3 text-left">Shop / Cashier</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Items Sold</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((ord: any) => {
                  const isCash = ord.payment?.method === "CASH";
                  return (
                    <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        <span className="px-2 py-1 rounded-md bg-muted text-[11px]">
                          {ord.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{ord.vendor.businessName}</div>
                        <div className="text-[10px] text-muted-foreground">{ord.cashier}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{ord.customer.fullName}</div>
                        {ord.customer.phone ? (
                          <div className="text-[10px] text-muted-foreground font-mono">{ord.customer.phone}</div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground italic">Walk-in</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{ord.itemCount} items</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                          {ord.items.map((i: any) => i.name).join(", ")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCash
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          {isCash ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          <span>{ord.payment?.method || "CASH"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-foreground text-sm">
                        Rs. {Number(ord.totalAmount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(ord.createdAt), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveReceiptOrder(ord)}
                          className="h-7 text-xs gap-1 font-semibold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total bills)
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

      {/* POS Receipt Modal */}
      <Dialog open={Boolean(activeReceiptOrder)} onOpenChange={(open) => !open && setActiveReceiptOrder(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
          {activeReceiptOrder && (
            <div>
              {/* Receipt Body */}
              <div id="pos-print-area" className="p-6 space-y-4 font-mono text-xs">
                {/* Store Header */}
                <div className="text-center space-y-1 border-b pb-4">
                  <h3 className="font-extrabold text-base tracking-wider uppercase">
                    {activeReceiptOrder.vendor.businessName}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">In-Store Point of Sale Register</p>
                  <p className="text-[10px] text-muted-foreground">TryMe.lk Verified Merchant</p>
                  <div className="pt-2">
                    <span className="font-bold text-xs bg-muted px-2.5 py-1 rounded-md">
                      {activeReceiptOrder.orderNumber}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-1 text-[11px] border-b pb-3 text-muted-foreground">
                  <div>
                    <span>Date: </span>
                    <span className="text-foreground font-semibold">
                      {format(new Date(activeReceiptOrder.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span>Cashier: </span>
                    <span className="text-foreground font-semibold">{activeReceiptOrder.cashier}</span>
                  </div>
                  <div>
                    <span>Customer: </span>
                    <span className="text-foreground font-semibold">{activeReceiptOrder.customer.fullName}</span>
                  </div>
                  {activeReceiptOrder.customer.phone && (
                    <div className="text-right">
                      <span>Phone: </span>
                      <span className="text-foreground font-semibold">{activeReceiptOrder.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="space-y-2 border-b pb-3">
                  <div className="grid grid-cols-12 font-bold text-[10px] text-muted-foreground uppercase">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Price</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>

                  {activeReceiptOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] items-center">
                      <div className="col-span-6">
                        <div className="font-semibold text-foreground truncate">{item.name}</div>
                        {item.variant && <div className="text-[10px] text-muted-foreground">{item.variant}</div>}
                      </div>
                      <div className="col-span-2 text-center text-muted-foreground">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {Number(item.unitPrice).toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-bold text-foreground">
                        {Number(item.totalPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div className="space-y-1 text-xs border-b pb-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>Rs. {Number(activeReceiptOrder.subtotal).toFixed(2)}</span>
                  </div>
                  {activeReceiptOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Total Discounts:</span>
                      <span>- Rs. {Number(activeReceiptOrder.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold pt-1 text-foreground border-t">
                    <span>Grand Total:</span>
                    <span>Rs. {Number(activeReceiptOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold text-foreground">{activeReceiptOrder.payment.method}</span>
                  </div>
                  {activeReceiptOrder.payment.method === "CASH" && (
                    <>
                      <div className="flex justify-between">
                        <span>Cash Received:</span>
                        <span>Rs. {Number(activeReceiptOrder.payment.cashReceived).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change Due:</span>
                        <span className="font-bold text-foreground">
                          Rs. {Number(activeReceiptOrder.payment.changeDue).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center pt-3 text-[10px] text-muted-foreground border-t">
                  <p>Thank you for shopping with us!</p>
                  <p className="mt-0.5">Physical receipt verified by TryMe Platform</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveReceiptOrder(null)}>
                  Close
                </Button>
                <Button size="sm" onClick={handlePrintReceipt} className="gap-1.5 font-bold">
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
