"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileImage,
  Globe,
  RefreshCw,
  Search,
  DollarSign,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  History,
  Settings2,
  PlusCircle,
  AlertTriangle,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";

const SHORT_TIER_LABELS: Record<string, string> = {
  ONE_PAGE: "1-Page",
  SIX_PAGES: "6-Page",
  TWELVE_PAGES: "12-Page",
};

export default function AdminWebsiteSubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalSubscribers: 0,
    totalSubscriptions: 0,
    activeCount: 0,
    pendingCount: 0,
    totalMRR: 0,
    totalLifetimeRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Selected Subscriber Modal (shows full plan history, upgrade path & admin controls)
  const [selectedSubscriberKey, setSelectedSubscriberKey] = useState<string | null>(null);
  const [selectedTierToAssign, setSelectedTierToAssign] = useState<WebsiteTier>("SIX_PAGES");

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
      const subsRes = await fetch("/api/admin/website-subscriptions");
      const subsJson = await subsRes.json();

      if (subsJson.success) {
        setSubscribers(subsJson.subscribers || []);
        if (subsJson.stats) setStats(subsJson.stats);
      } else {
        toast.error(subsJson.error || "Failed to load subscriptions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch subscriptions data");
    } finally {
      setLoading(false);
    }
  };

  const selectedSubscriber = useMemo(() => {
    if (!selectedSubscriberKey) return null;
    return subscribers.find((s) => s.subscriberKey === selectedSubscriberKey) || null;
  }, [subscribers, selectedSubscriberKey]);

  useEffect(() => {
    if (selectedSubscriber?.currentSubscription?.tier) {
      const curr = selectedSubscriber.currentSubscription.tier as WebsiteTier;
      if (curr === "ONE_PAGE") setSelectedTierToAssign("SIX_PAGES");
      else if (curr === "SIX_PAGES") setSelectedTierToAssign("TWELVE_PAGES");
      else setSelectedTierToAssign("TWELVE_PAGES");
    }
  }, [selectedSubscriberKey, selectedSubscriber?.currentSubscription?.tier]);

  const handleAction = async (
    subscriptionId: string,
    action: "APPROVE" | "REJECT" | "EXTEND_30_DAYS" | "CHANGE_TIER" | "EXPIRE_NOW",
    extra?: { newTier?: WebsiteTier; rejectionReason?: string }
  ) => {
    setProcessingId(subscriptionId);
    try {
      const res = await fetch("/api/admin/website-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action,
          ...(extra || {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchData();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  // Unique Subscriber Breakdown by Current Plan Tier
  const onePageSubscribers = subscribers.filter(
    (s) => s.currentSubscription?.tier === "ONE_PAGE"
  );
  const sixPageSubscribers = subscribers.filter(
    (s) => s.currentSubscription?.tier === "SIX_PAGES"
  );
  const twelvePageSubscribers = subscribers.filter(
    (s) => s.currentSubscription?.tier === "TWELVE_PAGES"
  );

  // Filtered Unique Subscribers (Never duplicates the same Vendor / Ads Seller)
  const filteredSubscribers = subscribers.filter((subGroup) => {
    const name = subGroup.entity?.businessName || "";
    const email = subGroup.entity?.email || "";
    const phone = subGroup.entity?.phone || "";
    const slug = subGroup.entity?.slug || "";
    const domain = subGroup.customDomain?.domain || "";

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      slug.toLowerCase().includes(q) ||
      domain.toLowerCase().includes(q);

    const currentSub = subGroup.currentSubscription;
    const pendingSub = subGroup.pendingSubscription;

    const matchesPlan =
      filterPlan === "ALL" ||
      currentSub?.tier === filterPlan ||
      (filterStatus === "PENDING_APPROVAL" && pendingSub?.tier === filterPlan);

    const matchesStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "PENDING_APPROVAL"
        ? Boolean(pendingSub) || currentSub?.status === "PENDING_APPROVAL"
        : currentSub?.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getDaysRemainingBadge = (expiresAt?: string | null, status?: string) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (status === "ACTIVE") {
      if (days <= 5) {
        return (
          <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
            {Math.max(0, days)}d left
          </span>
        );
      }
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
          {days}d left
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            WEBSITE BUILDER SUBSCRIPTIONS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage unique subscribers, inspect plan upgrade journeys, and verify bank deposit slips.
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          size="sm"
          className="rounded-xl font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* ── Plan Breakdown KPI Cards (Unique Subscribers) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total MRR Card */}
        <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Monthly Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              Rs. {(stats.totalMRR || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.activeCount} active subscribers • Lifetime: Rs.{" "}
              {(stats.totalLifetimeRevenue || 0).toLocaleString()}
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
              {onePageSubscribers.length}{" "}
              {onePageSubscribers.length === 1 ? "Subscriber" : "Subscribers"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {onePageSubscribers.filter((s) => Boolean(s.activeSubscription)).length} |
              Revenue: Rs.{" "}
              {(
                onePageSubscribers.filter((s) => Boolean(s.activeSubscription)).length * 1990
              ).toLocaleString()}
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
              {sixPageSubscribers.length}{" "}
              {sixPageSubscribers.length === 1 ? "Subscriber" : "Subscribers"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {sixPageSubscribers.filter((s) => Boolean(s.activeSubscription)).length} |
              Revenue: Rs.{" "}
              {(
                sixPageSubscribers.filter((s) => Boolean(s.activeSubscription)).length * 4990
              ).toLocaleString()}
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
              {twelvePageSubscribers.length}{" "}
              {twelvePageSubscribers.length === 1 ? "Subscriber" : "Subscribers"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {twelvePageSubscribers.filter((s) => Boolean(s.activeSubscription)).length} |
              Revenue: Rs.{" "}
              {(
                twelvePageSubscribers.filter((s) => Boolean(s.activeSubscription)).length * 9990
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Subscribers Filters & Table ── */}
      <Tabs defaultValue="all" className="space-y-6">
        {/* Plan & Status Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 self-center mr-1">
              Filter By Plan:
            </span>
            {[
              { key: "ALL", label: `All Subscribers (${subscribers.length})` },
              { key: "ONE_PAGE", label: `1-Page (Rs 1,990) (${onePageSubscribers.length})` },
              { key: "SIX_PAGES", label: `6-Page (Rs 4,990) (${sixPageSubscribers.length})` },
              { key: "TWELVE_PAGES", label: `12-Page (Rs 9,990) (${twelvePageSubscribers.length})` },
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
                {st === "PENDING_APPROVAL"
                  ? `Pending Slips (${stats.pendingCount || 0})`
                  : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar + Helper Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search store name, email, phone, or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-primary" />
            <span>
              Click any subscriber to view their full <strong>Plan &amp; Upgrade History</strong> and manage their subscription.
            </span>
          </p>
        </div>

        {/* Unique Subscribers Table */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-6">Subscriber / Store</th>
                  <th className="py-4 px-6">Current Plan &amp; Upgrade Path</th>
                  <th className="py-4 px-6">Latest Payment</th>
                  <th className="py-4 px-6">Status &amp; Expiry</th>
                  <th className="py-4 px-6">Bank Slip</th>
                  <th className="py-4 px-6 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileImage className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                          No subscribers match this filter
                        </p>
                        <p className="text-xs text-slate-400">
                          Try changing your plan filter or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((subGroup) => {
                    const sub = subGroup.currentSubscription;
                    const pendingSub = subGroup.pendingSubscription;
                    const entity = subGroup.entity || {};
                    const vendorName = entity.businessName || "Store";
                    const isVendor = subGroup.entityType === "VENDOR";
                    const tierMeta = TIER_LIMITS[sub?.tier as WebsiteTier] || {
                      name: sub?.tier || "Plan",
                      price: sub?.price || 0,
                    };

                    // Build compact upgrade trail (e.g. 1-Page → 6-Page → 12-Page)
                    const journeySteps: any[] = subGroup.planJourney || [];

                    return (
                      <tr
                        key={subGroup.subscriberKey}
                        onClick={() => setSelectedSubscriberKey(subGroup.subscriberKey)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Subscriber Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border relative overflow-hidden flex items-center justify-center font-bold text-slate-600 shrink-0 shadow-xs">
                              {entity.logo ? (
                                <Image
                                  src={entity.logo}
                                  alt={vendorName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                vendorName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">
                                  {vendorName}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase font-bold py-0 h-5"
                                >
                                  {isVendor ? "Vendor" : "Ads Seller"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {entity.email || entity.phone || `/${entity.slug}`}
                              </p>
                              {subGroup.customDomain && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Globe className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                    {subGroup.customDomain.domain}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Current Plan & Upgrade Path */}
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`font-black text-xs px-2.5 py-1 ${
                                  sub?.tier === "ONE_PAGE"
                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    : sub?.tier === "SIX_PAGES"
                                    ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                }`}
                              >
                                {tierMeta.name}
                              </Badge>

                              {subGroup.upgradeCount > 0 && (
                                <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>
                                    Upgraded{" "}
                                    {subGroup.upgradeCount > 1 ? `×${subGroup.upgradeCount}` : ""}
                                  </span>
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                              Rs. {Number(sub?.price || 0).toLocaleString()}
                              <span className="text-[10px] text-slate-400 font-normal">
                                {" "}
                                / month
                              </span>
                            </p>

                            {/* Compact Plan Progression Trail if > 1 record */}
                            {journeySteps.length > 1 && (
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {journeySteps.map((step, idx) => (
                                  <span
                                    key={step.id}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500"
                                  >
                                    <span
                                      className={`px-1.5 py-0.5 rounded ${
                                        idx === journeySteps.length - 1
                                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                                      }`}
                                    >
                                      {SHORT_TIER_LABELS[step.tier] || step.tier}
                                    </span>
                                    {idx < journeySteps.length - 1 && (
                                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Pending Upgrade Indicator if subscriber has an active plan AND a pending upgrade */}
                            {pendingSub && pendingSub.id !== sub?.id && (
                              <div className="pt-1">
                                <Badge className="bg-amber-500 text-white text-[10px] font-extrabold">
                                  ⚡ Pending Upgrade:{" "}
                                  {TIER_LIMITS[pendingSub.tier as WebsiteTier]?.name ||
                                    pendingSub.tier}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Latest Payment Method & Lifetime Spend */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {sub?.paymentMethod === "ONLINE_PAYHERE" ? (
                              <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                                PayHere Online (Instant)
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-slate-300 font-bold text-[10px] flex items-center gap-1 w-fit"
                              >
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>Bank Transfer</span>
                              </Badge>
                            )}
                            <p className="text-[11px] text-slate-400">
                              {sub?.createdAt
                                ? new Date(sub.createdAt).toLocaleDateString("en-GB")
                                : ""}
                            </p>
                            {subGroup.totalTransactions > 1 && (
                              <p className="text-[10px] font-bold text-slate-500">
                                {subGroup.totalTransactions} payments • Total Rs.{" "}
                                {Number(subGroup.totalSpent || 0).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status & Expiry */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                className={
                                  sub?.status === "ACTIVE"
                                    ? "bg-emerald-500 text-white font-bold"
                                    : sub?.status === "PENDING_APPROVAL"
                                    ? "bg-amber-500 text-white font-bold"
                                    : sub?.status === "REJECTED"
                                    ? "bg-rose-500 text-white font-bold"
                                    : "bg-slate-500 text-white font-bold"
                                }
                              >
                                {(sub?.status || "EXPIRED").replace("_", " ")}
                              </Badge>
                              {getDaysRemainingBadge(sub?.expiresAt, sub?.status)}
                            </div>
                            {sub?.expiresAt && (
                              <p className="text-[11px] text-slate-400">
                                Expires: {new Date(sub.expiresAt).toLocaleDateString("en-GB")}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Bank Deposit Slip */}
                        <td
                          className="py-4 px-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pendingSub?.bankSlipUrl || sub?.bankSlipUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSlipModalUrl(pendingSub?.bankSlipUrl || sub?.bankSlipUrl)
                              }
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
                        <td
                          className="py-4 px-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {pendingSub && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={processingId === pendingSub.id}
                                  onClick={() => handleAction(pendingSub.id, "APPROVE")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={processingId === pendingSub.id}
                                  onClick={() => handleAction(pendingSub.id, "REJECT")}
                                  className="font-bold text-xs rounded-xl"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubscriberKey(subGroup.subscriberKey)}
                              className="rounded-xl text-xs font-bold gap-1 border-slate-200 hover:border-primary hover:text-primary"
                            >
                              <span>Plan History</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

      {/* ── Subscriber Detail, Plan Upgrade Journey & Admin Management Modal ── */}
      <Dialog
        open={Boolean(selectedSubscriber)}
        onOpenChange={(open) => {
          if (!open) setSelectedSubscriberKey(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
          {selectedSubscriber && (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border relative overflow-hidden flex items-center justify-center font-black text-lg text-slate-700 shrink-0 shadow-xs">
                      {selectedSubscriber.entity?.logo ? (
                        <Image
                          src={selectedSubscriber.entity.logo}
                          alt={selectedSubscriber.entity.businessName || "Store"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        (selectedSubscriber.entity?.businessName || "S").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedSubscriber.entity?.businessName || "Store"}
                        </DialogTitle>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          {selectedSubscriber.entityType === "VENDOR" ? "Vendor" : "Ads Seller"}
                        </Badge>
                      </div>
                      <DialogDescription className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {selectedSubscriber.entity?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedSubscriber.entity.email}
                          </span>
                        )}
                        {selectedSubscriber.entity?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedSubscriber.entity.phone}
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                  </div>

                  {selectedSubscriber.entity?.slug && (
                    <Link
                      href={`/site/${
                        selectedSubscriber.customDomain?.dnsStatus === "ACTIVE"
                          ? selectedSubscriber.customDomain.domain
                          : selectedSubscriber.entity.slug
                      }`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 self-start sm:self-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      <span>Visit Live Website</span>
                    </Link>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* 1. Subscriber Overview KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Current Plan
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {TIER_LIMITS[
                          selectedSubscriber.currentSubscription?.tier as WebsiteTier
                        ]?.name || selectedSubscriber.currentSubscription?.tier}
                      </span>
                      <Badge
                        className={
                          selectedSubscriber.currentSubscription?.status === "ACTIVE"
                            ? "bg-emerald-500 text-white text-[10px] font-bold"
                            : selectedSubscriber.currentSubscription?.status === "PENDING_APPROVAL"
                            ? "bg-amber-500 text-white text-[10px] font-bold"
                            : "bg-slate-500 text-white text-[10px] font-bold"
                        }
                      >
                        {(selectedSubscriber.currentSubscription?.status || "EXPIRED").replace(
                          "_",
                          " "
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                      Rs.{" "}
                      {Number(
                        selectedSubscriber.currentSubscription?.price || 0
                      ).toLocaleString()}{" "}
                      / month
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Subscription Validity
                    </span>
                    <p className="font-black text-sm text-slate-900 dark:text-white">
                      {selectedSubscriber.currentSubscription?.expiresAt
                        ? `Expires: ${new Date(
                            selectedSubscriber.currentSubscription.expiresAt
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}`
                        : "Not Activated"}
                    </p>
                    <div className="flex items-center gap-2">
                      {getDaysRemainingBadge(
                        selectedSubscriber.currentSubscription?.expiresAt,
                        selectedSubscriber.currentSubscription?.status
                      )}
                      {selectedSubscriber.customDomain && (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {selectedSubscriber.customDomain.domain}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Plan Upgrades &amp; Spend
                    </span>
                    <p className="font-black text-sm text-slate-900 dark:text-white">
                      Rs. {Number(selectedSubscriber.totalSpent || 0).toLocaleString()} Total
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      {selectedSubscriber.totalTransactions} plan record(s) •{" "}
                      {selectedSubscriber.upgradeCount} upgrade(s)
                    </p>
                  </div>
                </div>

                {/* 2. Visual Step-by-Step Plan Progression Bar */}
                <div className="p-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:to-slate-900 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Subscriber Plan &amp; Upgrade Progression
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Chronological order (First plan → Current plan)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {(selectedSubscriber.planJourney || []).map((step: any, index: number) => {
                      const isCurrent =
                        step.id === selectedSubscriber.currentSubscription?.id;
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <div
                            className={`px-3 py-2 rounded-xl border text-xs transition-all ${
                              isCurrent
                                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 shadow-xs"
                                : "border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-white/10">
                                #{index + 1}
                              </span>
                              <span className="font-extrabold">{step.tierName}</span>
                              {isCurrent && (
                                <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                              <span>Rs. {step.price.toLocaleString()}</span>
                              <span>•</span>
                              <span>
                                {step.paymentMethod === "ONLINE_PAYHERE"
                                  ? "PayHere Online"
                                  : "Bank Slip"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(step.createdAt).toLocaleDateString("en-GB")}
                              </span>
                            </div>
                          </div>

                          {index < selectedSubscriber.planJourney.length - 1 && (
                            <div className="flex flex-col items-center text-primary px-0.5">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Full Detailed Plan & Upgrade History Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-primary" />
                      <span>Detailed Plan &amp; Upgrade History ({selectedSubscriber.history?.length || 0})</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {(selectedSubscriber.history || []).map((item: any) => {
                      const itemTierMeta = TIER_LIMITS[item.tier as WebsiteTier] || {
                        name: item.tier,
                        price: item.price,
                      };
                      const isCurrentActive =
                        item.id === selectedSubscriber.activeSubscription?.id;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrentActive
                              ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
                              : item.status === "PENDING_APPROVAL"
                              ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Event Type / Upgrade Badge */}
                              <Badge
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 ${
                                  item.eventType === "UPGRADE"
                                    ? "bg-purple-600 text-white"
                                    : item.eventType === "RENEWAL"
                                    ? "bg-blue-600 text-white"
                                    : item.eventType === "DOWNGRADE"
                                    ? "bg-amber-600 text-white"
                                    : "bg-slate-800 text-white dark:bg-slate-700"
                                }`}
                              >
                                {item.transitionLabel}
                              </Badge>

                              {/* Status Badge */}
                              {item.status === "ACTIVE" ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                  CURRENT ACTIVE PLAN
                                </Badge>
                              ) : item.status === "PENDING_APPROVAL" ? (
                                <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                                  PENDING ADMIN APPROVAL
                                </Badge>
                              ) : item.displayStatus === "SUPERSEDED_BY_UPGRADE" ? (
                                <Badge
                                  variant="outline"
                                  className="border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 text-[10px] font-bold"
                                >
                                  UPGRADED TO HIGHER PLAN
                                </Badge>
                              ) : item.status === "REJECTED" ? (
                                <Badge variant="destructive" className="text-[10px] font-bold">
                                  REJECTED
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                  EXPIRED
                                </Badge>
                              )}
                            </div>

                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              Rs. {Number(item.price || 0).toLocaleString()}{" "}
                              <span className="text-[10px] font-normal text-slate-400">
                                / 1 Month
                              </span>
                            </span>
                          </div>

                          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Plan Selected
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {itemTierMeta.name}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Payment Method
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.paymentMethod === "ONLINE_PAYHERE"
                                    ? "PayHere Online (Instant)"
                                    : "Bank Transfer Slip"}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Purchased On
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {new Date(item.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Valid Until
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {item.expiresAt
                                    ? new Date(item.expiresAt).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Pending Activation"}
                                </span>
                              </div>
                            </div>

                            {/* Slip & Approval Buttons per History Record */}
                            <div className="flex items-center gap-2 shrink-0">
                              {item.bankSlipUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSlipModalUrl(item.bankSlipUrl)}
                                  className="h-8 text-xs font-bold rounded-xl gap-1.5 border-primary text-primary"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </Button>
                              )}

                              {item.status === "PENDING_APPROVAL" && (
                                <>
                                  <Button
                                    size="sm"
                                    disabled={processingId === item.id}
                                    onClick={() => handleAction(item.id, "APPROVE")}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                                  >
                                    Approve &amp; Activate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={processingId === item.id}
                                    onClick={() => handleAction(item.id, "REJECT")}
                                    className="h-8 font-bold text-xs rounded-xl"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Admin Subscription Management Actions */}
                {selectedSubscriber.currentSubscription && (
                  <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-primary" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Admin Subscription Management Controls
                      </h4>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Change / Upgrade Plan Tier directly */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={selectedTierToAssign}
                          onChange={(e) =>
                            setSelectedTierToAssign(e.target.value as WebsiteTier)
                          }
                          className="h-9 px-3 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold"
                        >
                          <option value="ONE_PAGE">1-Page Website (Rs. 1,990)</option>
                          <option value="SIX_PAGES">6-Page Website (Rs. 4,990)</option>
                          <option value="TWELVE_PAGES">12-Page Website (Rs. 9,990)</option>
                        </select>
                        <Button
                          size="sm"
                          disabled={
                            processingId === selectedSubscriber.currentSubscription.id
                          }
                          onClick={() =>
                            handleAction(
                              selectedSubscriber.currentSubscription.id,
                              "CHANGE_TIER",
                              { newTier: selectedTierToAssign }
                            )
                          }
                          className="h-9 rounded-xl text-xs font-bold gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Change / Upgrade Plan</span>
                        </Button>
                      </div>

                      {/* Extend +30 Days or Expire Now */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            processingId === selectedSubscriber.currentSubscription.id
                          }
                          onClick={() =>
                            handleAction(
                              selectedSubscriber.currentSubscription.id,
                              "EXTEND_30_DAYS"
                            )
                          }
                          className="h-9 rounded-xl text-xs font-bold gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Extend +30 Days</span>
                        </Button>

                        {selectedSubscriber.currentSubscription.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              processingId === selectedSubscriber.currentSubscription.id
                            }
                            onClick={() =>
                              handleAction(
                                selectedSubscriber.currentSubscription.id,
                                "EXPIRE_NOW"
                              )
                            }
                            className="h-9 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Mark Expired</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <iframe
                  src={slipModalUrl}
                  title="Bank Slip PDF"
                  className="w-full h-[500px] border-none rounded-xl"
                />
              ) : (
                <img
                  src={slipModalUrl}
                  alt="Bank Deposit Slip"
                  className="max-h-[550px] w-auto object-contain rounded-xl shadow-lg"
                />
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
