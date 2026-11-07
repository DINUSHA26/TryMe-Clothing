"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Search,
  MessageSquare,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  RefreshCw,
  ExternalLink,
  Eye,
  Filter,
  CheckCircle2,
  Store,
  Megaphone,
  UserCheck,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDistance } from "date-fns";

export default function AdminAiAssistantOversightPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    activeStores: 0,
    vendorCount: 0,
    adsSellerCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [storeRole, setStoreRole] = useState("ALL"); // ALL | VENDOR | ADS_SELLER
  const [customerType, setCustomerType] = useState("ALL"); // ALL | REGISTERED | GUEST
  const [filterType, setFilterType] = useState("ALL"); // Context type
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (storeRole !== "ALL") q.set("storeRole", storeRole);
      if (customerType !== "ALL") q.set("customerType", customerType);
      if (filterType !== "ALL") q.set("type", filterType);

      const res = await fetch(`/api/admin/ai-conversations?${q.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setConversations(json.data.conversations || []);
        if (json.data.stats) setStats(json.data.stats);
      }
    } catch (err) {
      console.error("Failed to load AI conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [storeRole, customerType, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConversations();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStoreRole("ALL");
    setCustomerType("ALL");
    setFilterType("ALL");
  };

  // Helper to determine Store Badge
  const getStoreBadge = (conv: any) => {
    if (conv.vendorId || conv.contextType === "VENDOR" || conv.vendor) {
      return (
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300">
          Vendor
        </Badge>
      );
    }
    if (conv.adsSellerId || conv.contextType === "ADS_SELLER" || conv.contextType === "AD" || conv.adsSeller) {
      return (
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
          Ads Seller
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300">
        Store
      </Badge>
    );
  };

  // Helper to determine Customer Badge
  const isRegisteredCustomer = (conv: any) => {
    if (conv.customerId || conv.customer) return true;
    if (conv.customerEmail && conv.customerEmail.includes("@")) return true;
    if (conv.customerName && conv.customerName !== "Guest Customer") return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">AI Assistant Oversight</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring, role filtering, and chat transcripts of customer inquiries handled by Store AI Assistants.
          </p>
        </div>
        <Button
          onClick={fetchConversations}
          disabled={isLoading}
          variant="outline"
          className="rounded-xl flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-gradient-to-br from-orange-500/5 to-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Total Inquiries Handled
            </CardDescription>
            <CardTitle className="text-3xl font-black text-orange-600 dark:text-orange-400">
              {stats.totalConversations}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Customer conversations initiated with store assistants
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Total AI Messages Exchanged
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {stats.totalMessages}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Questions asked and automated answers grounded in inventory
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Active Stores Using AI
            </CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.activeStores}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Vendors and Ads Sellers with active AI customer chats
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by store name, customer name, phone, message content..."
                className="pl-9 rounded-xl font-medium"
              />
            </div>

            {/* Store Role Filter (Vendor vs Ads Seller) */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Store:</span>
              <select
                value={storeRole}
                onChange={(e) => setStoreRole(e.target.value)}
                className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none w-full md:w-auto"
              >
                <option value="ALL">All Stores (Vendors & Ads Sellers)</option>
                <option value="VENDOR">Vendors Only</option>
                <option value="ADS_SELLER">Ads Sellers Only</option>
              </select>
            </div>

            {/* Customer Type Filter (Registered vs Guest) */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Customer:</span>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none w-full md:w-auto"
              >
                <option value="ALL">All Customers</option>
                <option value="REGISTERED">Registered Customers</option>
                <option value="GUEST">Guest Customers</option>
              </select>
            </div>

            {/* Context Type Filter */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none w-full md:w-auto"
              >
                <option value="ALL">All Contexts</option>
                <option value="STANDALONE_SITE">Standalone Sites</option>
                <option value="VENDOR">Vendor Profile</option>
                <option value="ADS_SELLER">Ads Seller Profile</option>
                <option value="PRODUCT">Products</option>
                <option value="AD">Classified Ads</option>
              </select>
            </div>

            <Button type="submit" className="rounded-xl px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold w-full md:w-auto">
              Filter
            </Button>
          </form>

          {/* Active Filter Chips / Reset */}
          {(storeRole !== "ALL" || customerType !== "ALL" || filterType !== "ALL" || search) && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs">
              <span className="text-muted-foreground font-semibold">Active Filters:</span>
              {storeRole !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Store: {storeRole === "VENDOR" ? "Vendors" : "Ads Sellers"}
                </Badge>
              )}
              {customerType !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Customer: {customerType === "REGISTERED" ? "Registered" : "Guests"}
                </Badge>
              )}
              {filterType !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Context: {filterType}
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Query: {search}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 text-xs text-orange-600 font-bold px-2 hover:bg-orange-50"
              >
                Reset All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card className="rounded-2xl border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground text-left">
              <tr>
                <th className="py-3 px-4">Store / Touchpoint</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Latest Inquired Message</th>
                <th className="py-3 px-4 text-center">Messages</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading AI conversations...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No AI conversations found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => {
                  const isRegistered = isRegisteredCustomer(conv);
                  return (
                    <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span>{conv.storeName || conv.vendor?.businessName || conv.adsSeller?.businessName || "Store"}</span>
                          {getStoreBadge(conv)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                            {conv.contextType}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-[130px]" title={conv.contextId}>
                            {conv.contextId}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-bold text-foreground">
                            {conv.customerName || (conv.customer?.user ? `${conv.customer.user.firstName || ""} ${conv.customer.user.lastName || ""}`.trim() : "Guest Customer")}
                          </span>
                          {isRegistered ? (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Registered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                              Guest
                            </Badge>
                          )}
                        </div>
                        {(conv.customerPhone || conv.customerEmail || conv.customer?.user?.email) && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {conv.customerEmail || conv.customer?.user?.email || conv.customerPhone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                          {conv.lastMessage || "Conversation started"}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="font-bold text-xs rounded-full">
                          {conv.messageCount} msgs
                        </Badge>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDistance(new Date(conv.updatedAt), new Date(), { addSuffix: true })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedConv(conv)}
                          className="rounded-xl text-xs font-bold gap-1.5 border-orange-500/40 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Chat
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transcript Modal Dialog */}
      {selectedConv && (
        <Dialog open={!!selectedConv} onOpenChange={() => setSelectedConv(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <span>AI Chat: {selectedConv.storeName || "Store Assistant"}</span>
                  </DialogTitle>
                  <DialogDescription className="text-orange-100 text-xs mt-0.5">
                    Customer: {selectedConv.customerName || "Guest"} • {selectedConv.contextType} ({selectedConv.contextId})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
              {Array.isArray(selectedConv.messages) && selectedConv.messages.length > 0 ? (
                selectedConv.messages.map((m: any, idx: number) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold text-muted-foreground">
                        {isUser ? (
                          <>
                            <span>{selectedConv.customerName || "Customer"}</span>
                            <User className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-orange-600" />
                            <span>Store AI</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{m.timestamp || ""}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-orange-600 text-white rounded-br-xs font-medium"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground text-xs py-8">
                  No messages recorded in this conversation.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
