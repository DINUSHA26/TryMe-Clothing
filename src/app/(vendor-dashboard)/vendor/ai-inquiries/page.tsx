"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Search,
  MessageSquare,
  User,
  Phone,
  Mail,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  PhoneCall,
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

export default function VendorAiInquiriesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, unreadCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);

      const res = await fetch(`/api/vendor/ai-conversations?${q.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setConversations(json.data.conversations || []);
        if (json.data.stats) setStats(json.data.stats);
      }
    } catch (err) {
      console.error("Failed to load vendor AI inquiries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleOpenConversation = async (conv: any) => {
    setSelectedConv(conv);
    if (conv.unreadByStore) {
      try {
        await fetch("/api/vendor/ai-conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: conv.id }),
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadByStore: false } : c))
        );
        setStats((prev) => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Store AI Customer Inquiries</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Questions asked by customers to your Store AI Assistant, recommendations made, and lead contacts.
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border bg-gradient-to-br from-orange-500/5 to-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Total Customer Inquiries
            </CardDescription>
            <CardTitle className="text-3xl font-black text-orange-600 dark:text-orange-400">
              {stats.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total AI interactions handled for your products and store
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              New / Unread Inquiries
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {stats.unreadCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Inquiries you haven&apos;t reviewed yet
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchConversations();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inquiries by customer name, phone, or question topic..."
                className="pl-9 rounded-xl font-medium"
              />
            </div>
            <Button type="submit" className="rounded-xl px-5 bg-orange-600 hover:bg-orange-700 text-white">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground text-left">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Topic / Latest Inquiry</th>
                <th className="py-3 px-4">Context</th>
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
                    Loading inquiries...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No customer AI inquiries yet. When visitors ask questions on your storefront or standalone site, they will appear here!
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr
                    key={conv.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      conv.unreadByStore ? "bg-orange-500/5 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {conv.unreadByStore && (
                          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{conv.customerName || "Website Visitor"}</span>
                          </div>
                          {(conv.customerPhone || conv.customerEmail) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {conv.customerPhone || conv.customerEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                        {conv.lastMessage || "Question asked"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {conv.contextType}
                      </Badge>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[120px] mt-0.5">
                        {conv.contextId}
                      </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        {conv.customerPhone && (
                          <a
                            href={`https://wa.me/${conv.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Hello ${conv.customerName || "Customer"}, regarding your inquiry on our store...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="WhatsApp Customer"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenConversation(conv)}
                          className="rounded-xl text-xs font-bold gap-1.5 border-orange-500/40 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Chat
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Chat Dialog */}
      {selectedConv && (
        <Dialog open={!!selectedConv} onOpenChange={() => setSelectedConv(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <span>Customer Inquiry Transcript</span>
                  </DialogTitle>
                  <DialogDescription className="text-orange-100 text-xs mt-0.5">
                    Customer: {selectedConv.customerName || "Guest Visitor"} • Context: {selectedConv.contextType}
                  </DialogDescription>
                </div>
                {selectedConv.customerPhone && (
                  <a
                    href={`https://wa.me/${selectedConv.customerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white text-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-emerald-50 transition-colors shrink-0"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
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
                            <span>Your Store AI</span>
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
                  No messages in this inquiry.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
