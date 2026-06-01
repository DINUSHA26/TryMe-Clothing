"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { Trash2, ShieldAlert, Star, ShieldCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdVerificationModal } from "./AdVerificationModal";

interface AdWithSeller {
  id: string;
  title: string;
  price: number | null;
  priceNegotiable: boolean;
  images: string[];
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "REJECTED" | "PAUSED";
  isTopAd: boolean;
  views: number;
  district: string;
  localArea: string | null;
  createdAt: string;
  category: {
    name: string;
    icon: string | null;
  };
  subCategory: {
    name: string;
  };
  seller: {
    id: string;
    businessName: string | null;
    phone: string;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

interface MarketplaceAdsTableProps {
  ads: AdWithSeller[];
  onAdUpdated: () => void;
}

export function MarketplaceAdsTable({ ads, onAdUpdated }: MarketplaceAdsTableProps) {
  const [moderatingAd, setModeratingAd] = useState<AdWithSeller | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggleTopAd = async (ad: AdWithSeller) => {
    setTogglingId(ad.id);
    try {
      const response = await fetch(`/api/admin/marketplace/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTopAd: !ad.isTopAd }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Failed to Update Ad",
          description: result.error || "Failed to update Top Ad status",
        });
        return;
      }
      toast({
        title: "Success",
        description: ad.isTopAd
          ? "Ad removed from Top Ads"
          : "Ad promoted to Top Ad successfully",
      });
      onAdUpdated();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this ad? This action cannot be undone.")) return;
    setDeletingId(adId);
    try {
      const response = await fetch(`/api/admin/marketplace/${adId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: result.error || "Failed to delete ad",
        });
        return;
      }
      toast({
        title: "Success",
        description: "Classified ad deleted successfully",
      });
      onAdUpdated();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Detail</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No ads found
                </TableCell>
              </TableRow>
            ) : (
              ads.map((ad) => {
                const sellerName = ad.seller.businessName || 
                  `${ad.seller.user.firstName || ""} ${ad.seller.user.lastName || ""}`.trim() || 
                  ad.seller.user.email;
                return (
                  <TableRow key={ad.id}>
                    {/* Title + Thumbnail */}
                    <TableCell className="font-semibold text-gray-900 max-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                          {ad.images?.[0] ? (
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-xs text-gray-400">No Image</span>
                          )}
                        </div>
                        <div className="truncate">
                          <div className="truncate font-medium text-sm text-gray-950 flex items-center gap-1.5">
                            {ad.title}
                            {ad.isTopAd && (
                              <Badge className="bg-amber-500 text-white hover:bg-amber-600 px-1 py-0 h-4 text-[9px] flex items-center gap-0.5 border-none">
                                <Star className="h-2 w-2 fill-white text-white" />
                                TOP
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                            Views: {ad.views}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <span>{ad.category.icon}</span>
                        <span>{ad.category.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{ad.subCategory.name}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-800">{sellerName}</div>
                      <div className="text-xs text-muted-foreground">{ad.seller.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-800">{ad.district}</div>
                      <div className="text-xs text-muted-foreground">{ad.localArea || "Entire District"}</div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">
                      {ad.price ? (
                        <>
                          Rs. {Number(ad.price).toLocaleString("en-LK")}
                          {ad.priceNegotiable && <span className="text-[10px] text-gray-400 font-normal block">Negotiable</span>}
                        </>
                      ) : (
                        <span className="text-gray-400 font-medium">Contact for price</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ad.status === "PENDING" && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                          Pending
                        </Badge>
                      )}
                      {ad.status === "ACTIVE" && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Active
                        </Badge>
                      )}
                      {ad.status === "REJECTED" && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          Rejected
                        </Badge>
                      )}
                      {ad.status === "EXPIRED" && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                          Expired
                        </Badge>
                      )}
                      {ad.status === "PAUSED" && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          Paused
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistance(new Date(ad.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Moderate ad decision */}
                        {ad.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-[#FF6600]/10 hover:bg-[#FF6600]/20 text-[#FF6600] border-[#FF6600]/20 rounded-xl"
                            onClick={() => setModeratingAd(ad)}
                          >
                            Moderate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModeratingAd(ad)}
                            title="Update moderation status"
                          >
                            <ShieldAlert className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}

                        {/* Top ad promotion */}
                        {ad.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleTopAd(ad)}
                            disabled={togglingId === ad.id}
                            title={ad.isTopAd ? "Remove Top Ad Status" : "Promote to Top Ad"}
                          >
                            {togglingId === ad.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                            ) : (
                              <Star className={`h-4 w-4 ${ad.isTopAd ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                            )}
                          </Button>
                        )}

                        {/* Delete ad */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={deletingId === ad.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Moderate Verification Dialog */}
      {moderatingAd && (
        <AdVerificationModal
          isOpen={!!moderatingAd}
          onClose={() => setModeratingAd(null)}
          adId={moderatingAd.id}
          adTitle={moderatingAd.title}
          onActionComplete={onAdUpdated}
        />
      )}
    </>
  );
}
