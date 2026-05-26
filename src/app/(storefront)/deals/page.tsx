"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Tag, Store, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealCard } from "@/components/deals/DealCard";

interface Deal {
  id: string;
  code: string;
  type: "FLAT" | "PERCENTAGE";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validUntil: string | null;
  isExpiringSoon: boolean;
  vendor: {
    businessName: string;
    slug: string;
    logo: string | null;
  } | null;
}

interface DealStats {
  total: number;
  platformDeals: number;
  vendorDeals: number;
  expiringSoon: number;
}

type TabValue = "all" | "platform" | "vendor" | "expiring";

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({
    total: 0,
    platformDeals: 0,
    vendorDeals: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/deals");
        const data = await response.json();
        if (data.success) {
          setDeals(data.data.deals);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // Client-side filtering by tab
  const filteredDeals = deals.filter((deal) => {
    if (activeTab === "platform") return deal.vendor === null;
    if (activeTab === "vendor") return deal.vendor !== null;
    if (activeTab === "expiring") return deal.isExpiringSoon;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl md:text-4xl font-bold">Today&apos;s Deals</h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Exclusive discount codes from Try Me and our trusted vendors.
          Copy a code and use it at checkout to save instantly.
        </p>

        {!loading && stats.total > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {stats.total} Active {stats.total === 1 ? "Deal" : "Deals"}
            </span>
            {stats.vendorDeals > 0 && (
              <span className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                {stats.vendorDeals} Vendor {stats.vendorDeals === 1 ? "Deal" : "Deals"}
              </span>
            )}
            {stats.expiringSoon > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Clock className="h-4 w-4" />
                {stats.expiringSoon} Expiring Soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {!loading && stats.total > 0 && (
        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList>
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="platform">
                Platform ({stats.platformDeals})
              </TabsTrigger>
              <TabsTrigger value="vendor">
                Vendors ({stats.vendorDeals})
              </TabsTrigger>
              {stats.expiringSoon > 0 && (
                <TabsTrigger value="expiring">
                  Expiring ({stats.expiringSoon})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state — no featured deals at all */}
      {!loading && stats.total === 0 && (
        <div className="text-center py-20">
          <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Deals Available</h3>
          <p className="text-muted-foreground mb-6">
            Check back soon — new deals are added regularly.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      )}

      {/* Empty state — tab has no matches */}
      {!loading && stats.total > 0 && filteredDeals.length === 0 && (
        <div className="text-center py-20">
          <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Deals in This Category</h3>
          <p className="text-muted-foreground mb-6">
            No deals match this filter. Try another tab.
          </p>
          <Button variant="outline" onClick={() => setActiveTab("all")}>
            View All Deals
          </Button>
        </div>
      )}

      {/* Deals grid */}
      {!loading && filteredDeals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
