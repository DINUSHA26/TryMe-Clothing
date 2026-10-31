"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ShoppingBag, MessageCircle, Sparkles } from "lucide-react";

interface CatalogViewProps {
  products: any[];
  primaryColor: string;
  whatsappUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  entityType?: "VENDOR" | "ADS_SELLER";
}

export default function CatalogView({
  products,
  primaryColor,
  whatsappUrl,
  title,
  subtitle,
  badge,
  entityType,
}: CatalogViewProps) {
  const [search, setSearch] = useState("");

  const filtered = (products || []).filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const itemTitle = (p.title || p.name || "").toLowerCase();
    const itemDesc = (p.description || "").toLowerCase();
    return itemTitle.includes(term) || itemDesc.includes(term);
  });

  return (
    <div>
      {/* Header Banner */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badge || (entityType === "ADS_SELLER" ? "VERIFIED CLASSIFIEDS" : "OUR STORE CATALOG")}</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {title || (entityType === "ADS_SELLER" ? "My Ads & Listings" : "Store Catalog")}
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            {subtitle || "Browse verified catalog items and order directly via WhatsApp or visit our store."}
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto pt-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, item name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-white text-xs font-semibold focus:outline-none focus:ring-2 shadow-sm"
              style={{ "--tw-ring-color": primaryColor } as any}
            />
          </div>
        </div>
      </section>

      {/* Grid of Products */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 pb-3 border-b">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 underline"
            >
              Clear search
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p: any, idx: number) => {
              const itemTitle = p.title || p.name || `Item #${idx + 1}`;
              const price =
                p.price != null && p.price !== ""
                  ? `Rs. ${Number(p.price).toLocaleString()}`
                  : p.type === "AD"
                  ? "Contact for price"
                  : "Rs. 0";
              const img = p.image || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : null);

              return (
                <div
                  key={p.id || idx}
                  className="bg-white rounded-2xl border p-4 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square rounded-xl bg-slate-100 relative overflow-hidden mb-3">
                      {img ? (
                        <Image
                          src={img}
                          alt={itemTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-10 h-10" />
                        </div>
                      )}
                      {p.type && (
                        <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[9px] uppercase font-black text-white px-2 py-0.5 rounded-full">
                          {p.type === "AD" ? "Verified Ad" : "In Stock"}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{itemTitle}</h3>
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Price</span>
                      <span className="text-sm font-black text-slate-900">{price}</span>
                    </div>
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(
                        `Hi, I'm interested in ordering: ${itemTitle} (${price}) from your website catalog!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-90 inline-flex items-center gap-1.5 transition-all"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No matching items found</h3>
            <p className="text-xs text-slate-500">
              {search ? "Try searching with a different keyword" : "No catalog products currently available."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
