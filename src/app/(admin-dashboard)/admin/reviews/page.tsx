"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  Package,
  Eye,
  EyeOff,
  Trash2,
  Store,
  Globe,
  Building2,
  MessageSquare,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  source: "TRYME_MARKETPLACE" | "VENDOR_WEBSITE";
  vendorReply: string | null;
  vendorId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    vendorName: string;
  };
  customer: {
    name: string;
    email: string | null;
  };
}

interface VendorOption {
  id: string;
  businessName: string;
  slug: string;
}

interface ChannelCounts {
  all: number;
  tryme: number;
  website: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [channelCounts, setChannelCounts] = useState<ChannelCounts>({
    all: 0,
    tryme: 0,
    website: 0,
  });
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<"all" | "tryme" | "website">("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [page, sourceFilter, ratingFilter, visibilityFilter, vendorFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      if (visibilityFilter !== "all") params.set("visible", visibilityFilter);
      if (vendorFilter !== "all") params.set("vendorId", vendorFilter);

      const res = await fetch(`/api/admin/reviews?${params}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setReviews(data.data.reviews || []);
        if (data.data.channelCounts) setChannelCounts(data.data.channelCounts);
        if (data.data.vendors) setVendors(data.data.vendors);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || "Failed to load reviews");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, isVisible: !r.isVisible } : r
          )
        );
        toast.success(
          review.isVisible ? "Review hidden from public" : "Review made visible"
        );
      } else {
        toast.error(data.error || "Failed to update review");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/reviews/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== deleteId));
        toast.success("Review deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleteId(null);
    }
  };

  const resetAllFilters = () => {
    setSourceFilter("all");
    setRatingFilter("all");
    setVisibilityFilter("all");
    setVendorFilter("all");
    setPage(1);
  };

  const isFiltered =
    sourceFilter !== "all" ||
    ratingFilter !== "all" ||
    visibilityFilter !== "all" ||
    vendorFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reviews Moderation</h1>
        <p className="text-muted-foreground">
          View and moderate customer product reviews and testimonials across TryMe.lk Marketplace and Vendor Websites
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Channel / Source Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
              Review Channel / Platform
            </label>
            <div className="inline-flex flex-wrap p-1 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("all");
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sourceFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>All Reviews</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/15">
                  {channelCounts.all}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("tryme");
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sourceFilter === "tryme"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>TryMe Marketplace</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {channelCounts.tryme}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("website");
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sourceFilter === "website"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Vendor Websites</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {channelCounts.website}
                </span>
              </button>
            </div>
          </div>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="self-start sm:self-auto h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-dashed hover:border-solid"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
          {/* Vendor Filter */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Vendor / Seller</span>
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-xl border bg-background text-xs font-semibold focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="all">All Vendors &amp; Sellers</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} ({v.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span>Rating</span>
            </label>
            <Select
              value={ratingFilter}
              onValueChange={(v) => {
                setRatingFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Filter */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Visibility</span>
            </label>
            <Select
              value={visibilityFilter}
              onValueChange={(v) => {
                setVisibilityFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="true">Visible</SelectItem>
                <SelectItem value="false">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {pagination && (
          <div className="text-xs font-bold text-muted-foreground pt-1">
            Total: {pagination.total} review{pagination.total !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-4 bg-card">
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="border rounded-2xl p-12 text-center bg-card">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-1">No reviews found</h3>
            <p className="text-muted-foreground text-sm">
              No reviews match your current filters.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`border rounded-2xl p-4 sm:p-5 bg-card transition-opacity shadow-xs ${
                !review.isVisible ? "opacity-65 bg-muted/20" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Product thumbnail */}
                {review.product.slug ? (
                  <Link href={`/products/${review.product.slug}`} className="shrink-0">
                    {review.product.image ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border bg-muted">
                        <Image
                          src={review.product.image}
                          alt={review.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="shrink-0">
                    {review.product.image ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border bg-muted">
                        <Image
                          src={review.product.image}
                          alt={review.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {review.product.slug ? (
                          <Link
                            href={`/products/${review.product.slug}`}
                            className="font-bold hover:underline text-foreground"
                          >
                            {review.product.name}
                          </Link>
                        ) : (
                          <span className="font-bold text-foreground">
                            {review.product.name}
                          </span>
                        )}

                        <Badge variant="outline" className="text-xs py-0.5 font-bold">
                          {review.product.vendorName}
                        </Badge>

                        {/* Channel Badge */}
                        {review.source === "TRYME_MARKETPLACE" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                            <Store className="w-3 h-3" />
                            <span>TryMe Marketplace</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold">
                            <Globe className="w-3 h-3" />
                            <span>Vendor Website</span>
                          </span>
                        )}

                        {!review.isVisible && (
                          <Badge variant="secondary" className="text-xs py-0 text-amber-600 bg-amber-500/10 border-amber-200">
                            Hidden
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          by <strong className="text-foreground">{review.customer.name}</strong>
                          {review.customer.email && ` (${review.customer.email})`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(review)}
                        title={review.isVisible ? "Hide review" : "Show review"}
                        className="h-8 w-8 p-0"
                      >
                        {review.isVisible ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(review.id)}
                        title="Delete review"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-sm text-foreground/90 font-medium">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}

                  {/* Vendor Reply */}
                  {review.vendorReply && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-muted/60 border text-xs flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-foreground">Vendor Reply: </span>
                        <span className="text-muted-foreground">{review.vendorReply}</span>
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
