"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Store, Package, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  businessAddress: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  _count: {
    products: number;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();

      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-black tracking-tight mb-3">BROWSE VENDORS</h1>
        <p className="text-muted-foreground font-medium text-lg italic">
          Explore the curated collection of top-tier sellers and unique brands.
        </p>
      </div>

      {/* Search Bar - Premium Style */}
      <div className="mb-12 max-w-2xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Search by vendor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-2 transition-all focus:ring-0 focus:border-primary text-base font-bold shadow-sm"
          />
        </div>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-3xl border-2">
              <Skeleton className="h-40 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-end -mt-12">
                  <Skeleton className="h-20 w-20 rounded-2xl border-4 border-white" />
                  <div className="space-y-2 flex-1 pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed">
          <Store className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30 animate-pulse" />
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3">No Vendors Found</h3>
          <p className="text-muted-foreground font-medium max-w-md mx-auto italic px-6">
            {searchQuery
              ? `We couldn't find any vendor matching "${searchQuery}". Try a different name.`
              : "Our marketplace is currently being curated. Check back soon for exciting new brands!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group"
            >
              <Card className="overflow-hidden rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col bg-white dark:bg-slate-950">
                {/* Banner */}
                <div className="h-32 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  {vendor.banner ? (
                    <Image
                      src={vendor.banner}
                      alt={vendor.businessName}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                      <Store className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                  <Badge className="absolute top-4 right-4 bg-white/90 text-black border-none font-black uppercase tracking-widest text-[10px] h-7 px-3 backdrop-blur-sm">
                    {vendor._count.products} Products
                  </Badge>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-0 flex-1 flex flex-col">
                  {/* Logo Overlay */}
                  <div className="flex gap-4 items-end -mt-10 mb-5 relative z-10">
                    <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-xl overflow-hidden relative flex-shrink-0">
                      {vendor.logo ? (
                        <Image src={vendor.logo} alt={vendor.businessName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                          <Store className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="pb-1 min-w-0">
                      <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors truncate uppercase tracking-tight">
                        {vendor.businessName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller</span>
                      </div>
                    </div>
                  </div>

                  {/* Description & Details */}
                  <div className="space-y-4 flex-1">
                    {vendor.description ? (
                      <p className="text-sm text-muted-foreground font-medium italic line-clamp-3 leading-relaxed">
                        "{vendor.description}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 font-medium italic">
                        Experience quality products and exceptional service from {vendor.businessName}.
                      </p>
                    )}


                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">View Store</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transform transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
