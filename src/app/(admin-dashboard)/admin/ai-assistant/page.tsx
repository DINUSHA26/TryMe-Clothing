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
  Sparkles,
  Eye,
  Filter,
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
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, activeStores: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
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
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConversations();
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
            Real-time monitoring and chat transcripts of customer inquiries handled by Store AI Assistants.
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
            Vendors and Ads Sellers with customer AI activity
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by store name, customer name, phone, message content..."
                className="pl-9 rounded-xl font-medium"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none"
              >
                <option value="ALL">All Contexts</option>
                <option value="VENDOR">Vendors</option>
                <option value="ADS_SELLER">Ads Sellers</option>
                <option value="PRODUCT">Products</option>
                <option value="AD">Classified Ads</option>
                <option value="STANDALONE_SITE">Standalone Sites</option>
              </select>
              <Button type="submit" className="rounded-xl px-5 bg-orange-600 hover:bg-orange-700 text-white">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card className="rounded-2xl border overflow-hidden">
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
                    No AI conversations found. Once customers chat with Store Assistants, they will appear here!
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {conv.storeName || "Store"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                          {conv.contextType}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {conv.contextId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{conv.customerName || "Guest Customer"}</span>
                      </div>
                      {(conv.customerPhone || conv.customerEmail) && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {conv.customerPhone || conv.customerEmail}
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
                ))
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
                    <span>AI Chat: {selectedConv.storeName}</span>
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
