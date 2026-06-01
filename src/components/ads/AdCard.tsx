"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Star, ShieldCheck, MapPin, Tag, Clock, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    price: number | null | any;
    priceNegotiable: boolean;
    images: string[];
    isTopAd: boolean;
    district: string;
    localArea: string | null;
    createdAt: string | Date;
    category: {
      name: string;
      icon: string | null;
    };
    subCategory: {
      name: string;
    };
    seller: {
      businessName: string | null;
    };
  };
}

export function AdCard({ ad }: AdCardProps) {
  const sellerName = ad.seller.businessName || "Member";
  const locationText = ad.localArea ? `${ad.localArea}, ${ad.district}` : ad.district;

  return (
    <Link
      href={`/marketplace/${ad.id}`}
      className={cn(
        "flex flex-row p-3 sm:p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all duration-300 gap-3 sm:gap-4 relative overflow-hidden group hover:border-gray-200",
        ad.isTopAd && "border-amber-400 bg-amber-50/10 hover:border-amber-500 shadow-sm"
      )}
    >
      {/* Featured ribbon */}
      {ad.isTopAd && (
        <span className="absolute top-0 left-0 bg-amber-500 text-white font-extrabold text-[9px] uppercase tracking-wider py-1 px-3.5 rounded-br-2xl shadow-sm z-10 flex items-center gap-1 border-b border-r border-amber-600/20">
          <Star className="h-2.5 w-2.5 fill-white text-white" />
          Featured
        </span>
      )}

      {/* Thumbnail Container */}
      <div className="w-[110px] sm:w-[160px] h-[90px] sm:h-[120px] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
        {ad.images?.[0] ? (
          <img
            src={ad.images[0]}
            alt={ad.title}
            className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-500"
          />
        ) : (
          <span className="text-xs font-semibold text-gray-400">No Image</span>
        )}
      </div>

      {/* Detail Content */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 group-hover:text-[#FF6600] transition-colors leading-snug line-clamp-2 text-sm sm:text-base">
              {ad.title}
            </h3>
          </div>

          {/* Seller badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="text-gray-400 tracking-wide uppercase">{sellerName}</span>
            <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 font-bold px-1.5 py-0 h-4 uppercase flex items-center gap-0.5">
              <ShieldCheck className="h-2.5 w-2.5" />
              Verified Seller
            </Badge>
          </div>

          {/* Location & Category */}
          <div className="flex flex-col gap-0.5 text-[11px] sm:text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {ad.category.icon} {ad.category.name} &gt; {ad.subCategory.name}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info: Price & Timestamp */}
        <div className="flex flex-wrap items-center justify-between border-t border-gray-50 pt-2 mt-2 sm:pt-2.5 sm:mt-3.5 gap-1">
          <div className="font-black text-[#FF6600] text-sm sm:text-lg">
            {ad.price ? (
              <>
                Rs. {Number(ad.price).toLocaleString("en-LK")}
                {ad.priceNegotiable && (
                  <span className="text-[10px] text-gray-400 font-normal pl-1.5">Negotiable</span>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-bold text-xs sm:text-sm">Contact for price</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 font-medium">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDistance(new Date(ad.createdAt), new Date(), {
                addSuffix: true,
              })}
            </span>

            {/* Featured crown icon on bottom right */}
            {ad.isTopAd ? (
              <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm ml-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-orange-50/5 border border-orange-200 flex items-center justify-center text-orange-500 shadow-sm ml-1" title="Bump Up">
                <ArrowUp className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
