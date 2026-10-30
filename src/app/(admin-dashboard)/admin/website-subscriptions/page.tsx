"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileImage,
  X,
  Globe,
  RefreshCw,
  Search,
  DollarSign,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";

export default function AdminWebsiteSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalSubscriptions: 0,
    activeCount: 0,
    pendingCount: 0,
    totalMRR: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Slip preview modal
  const [slipModalUrl, setSlipModalUrl] = useState<string | null>(null);

  // Processing action state
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, domainsRes] = await Promise.all([
        fetch("/api/admin/website-subscriptions"),
        fetch("/api/admin/website-subscriptions/domains"),
      ]);

      const subsJson = await subsRes.json();
      const domainsJson = await domainsRes.json();

      if (subsJson.success) {
        setSubscriptions(subsJson.data || []);
        if (subsJson.stats) setStats(subsJson.stats);
      }
      if (domainsJson.success) {
        setDomains(domainsJson.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch subscriptions data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (subscriptionId: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(subscriptionId);
    try {
      const res = await fetch("/api/admin/website-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Plan Breakdown Stats
  const onePageSubs = subscriptions.filter((s) => s.tier === "ONE_PAGE");
  const sixPageSubs = subscriptions.filter((s) => s.tier === "SIX_PAGES");
  const twelvePageSubs = subscriptions.filter((s) => s.tier === "TWELVE_PAGES");

  const filteredSubs = subscriptions.filter((s) => {
    const name = s.vendor?.businessName || s.adsSeller?.businessName || "";
    const email = s.vendor?.businessEmail || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "ALL" || s.tier === filterPlan;
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            WEBSITE BUILDER SUBSCRIPTIONS
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage vendor website plans, verify bank payment slips, and monitor subscriber tiers.
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl font-bold self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* ── Plan Breakdown KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total MRR Card */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Monthly Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              Rs. {stats.totalMRR.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.activeCount} active paid subscriptions
            </p>
          </CardContent>
        </Card>

        {/* 1-Page Tier Subscribers */}
        <Card
          onClick={() => setFilterPlan(filterPlan === "ONE_PAGE" ? "ALL" : "ONE_PAGE")}
          className={`rounded-2xl border cursor-pointer transition-all shadow-sm ${
            filterPlan === "ONE_PAGE"
              ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-900 hover:border-blue-300"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600">
              1-Page Website (Rs 1,990)
            </CardTitle>
            <Layers className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {onePageSubs.length} Subscribers
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {onePageSubs.filter((s) => s.status === "ACTIVE").length} | Revenue: Rs.{" "}
              {(onePageSubs.filter((s) => s.status === "ACTIVE").length * 1990).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* 6-Page Tier Subscribers */}
        <Card
          onClick={() => setFilterPlan(filterPlan === "SIX_PAGES" ? "ALL" : "SIX_PAGES")}
          className={`rounded-2xl border cursor-pointer transition-all shadow-sm ${
            filterPlan === "SIX_PAGES"
              ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-500/20"
              : "bg-white dark:bg-slate-900 hover:border-purple-300"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-600">
              6-Page Website (Rs 4,990)
            </CardTitle>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {sixPageSubs.length} Subscribers
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {sixPageSubs.filter((s) => s.status === "ACTIVE").length} | Revenue: Rs.{" "}
              {(sixPageSubs.filter((s) => s.status === "ACTIVE").length * 4990).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* 12-Page Tier Subscribers */}
        <Card
          onClick={() => setFilterPlan(filterPlan === "TWELVE_PAGES" ? "ALL" : "TWELVE_PAGES")}
          className={`rounded-2xl border cursor-pointer transition-all shadow-sm ${
            filterPlan === "TWELVE_PAGES"
              ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 hover:border-rose-300"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600">
              12-Page Enterprise (Rs 9,990)
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {twelvePageSubs.length} Subscribers
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {twelvePageSubs.filter((s) => s.status === "ACTIVE").length} | Revenue: Rs.{" "}
              {(twelvePageSubs.filter((s) => s.status === "ACTIVE").length * 9990).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Subscriptions Tabs & Filters ── */}
      <Tabs defaultValue="all" className="space-y-6">
        {/* Plan Filter Tabs Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 self-center mr-1">
              Filter By Plan:
            </span>
            {[
              { key: "ALL", label: `All Plans (${subscriptions.length})` },
              { key: "ONE_PAGE", label: `1-Page (Rs 1,990) (${onePageSubs.length})` },
              { key: "SIX_PAGES", label: `6-Page (Rs 4,990) (${sixPageSubs.length})` },
              { key: "TWELVE_PAGES", label: `12-Page (Rs 9,990) (${twelvePageSubs.length})` },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setFilterPlan(p.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterPlan === p.key
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 self-center mr-1">
              Status:
            </span>
            {["ALL", "PENDING_APPROVAL", "ACTIVE", "EXPIRED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? "bg-primary text-white font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "PENDING_APPROVAL" ? `Pending Slips (${stats.pendingCount})` : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search vendor name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl text-sm"
          />
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-6">Vendor / Store</th>
                  <th className="py-4 px-6">Subscribed Plan</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Bank Deposit Slip</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileImage className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                          No subscriptions match this filter
                        </p>
                        <p className="text-xs text-slate-400">
                          Try changing your plan filter or status selection.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const vendorName = sub.vendor?.businessName || sub.adsSeller?.businessName || "Store";
                    const isVendor = Boolean(sub.vendor);
                    const tierMeta = TIER_LIMITS[sub.tier as WebsiteTier] || {
                      name: sub.tier,
                      price: sub.price,
                    };

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border relative overflow-hidden flex items-center justify-center font-bold text-slate-600 shrink-0">
                              {sub.vendor?.logo ? (
                                <Image src={sub.vendor.logo} alt={vendorName} fill className="object-cover" />
                              ) : (
                                vendorName.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-slate-900 dark:text-white text-sm">{vendorName}</p>
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-5">
                                  {isVendor ? "Vendor" : "Ads Seller"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {sub.vendor?.businessEmail || sub.vendor?.businessPhone || `/${sub.vendor?.slug || sub.adsSeller?.slug}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Plan Tier */}
                        <td className="py-4 px-6">
                          <Badge
                            className={`font-black text-xs px-2.5 py-1 ${
                              sub.tier === "ONE_PAGE"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : sub.tier === "SIX_PAGES"
                                ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}
                          >
                            {tierMeta.name}
                          </Badge>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                            Rs. {Number(sub.price).toLocaleString()}
                            <span className="text-[10px] text-slate-400 font-normal"> / month</span>
                          </p>
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {sub.paymentMethod === "ONLINE_PAYHERE" ? (
                              <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                                PayHere Online (Instant)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-slate-300 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>Bank Transfer</span>
                              </Badge>
                            )}
                            <p className="text-[11px] text-slate-400">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <Badge
                            className={
                              sub.status === "ACTIVE"
                                ? "bg-emerald-500 text-white font-bold"
                                : sub.status === "PENDING_APPROVAL"
                                ? "bg-amber-500 text-white font-bold"
                                : sub.status === "REJECTED"
                                ? "bg-rose-500 text-white font-bold"
                                : "bg-slate-500 text-white font-bold"
                            }
                          >
                            {sub.status.replace("_", " ")}
                          </Badge>
                          {sub.expiresAt && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        {/* Slip */}
                        <td className="py-4 px-6">
                          {sub.bankSlipUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSlipModalUrl(sub.bankSlipUrl)}
                              className="text-xs font-bold rounded-xl flex items-center gap-1.5 border-primary text-primary hover:bg-primary hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Slip
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">— Online —</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {sub.status === "PENDING_APPROVAL" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={processingId === sub.id}
                                onClick={() => handleAction(sub.id, "APPROVE")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                              >
                                Approve & Unlock
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === sub.id}
                                onClick={() => handleAction(sub.id, "REJECT")}
                                className="font-bold text-xs rounded-xl"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : sub.status === "ACTIVE" ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Tabs>

      {/* ── Bank Slip Full Resolution Preview Modal ── */}
      <Dialog open={Boolean(slipModalUrl)} onOpenChange={() => setSlipModalUrl(null)}>
        <DialogContent className="max-w-2xl p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Bank Deposit Slip Verification
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 rounded-2xl overflow-hidden border bg-slate-900/5 min-h-[380px] flex items-center justify-center p-2">
            {slipModalUrl ? (
              slipModalUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={slipModalUrl} title="Bank Slip PDF" className="w-full h-[500px] border-none rounded-xl" />
              ) : (
                <img src={slipModalUrl} alt="Bank Deposit Slip" className="max-h-[550px] w-auto object-contain rounded-xl shadow-lg" />
              )
            ) : (
              <span className="text-xs text-slate-400">Loading slip preview...</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
