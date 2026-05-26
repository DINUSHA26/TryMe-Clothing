"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  customer: {
    name: string;
  };
}

interface Stats {
  totalReviews: number;
  avgRating: number;
  ratingCounts: Record<number, number>;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [page, ratingFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (ratingFilter !== "all") params.set("rating", ratingFilter);

      const res = await fetch(`/api/vendor/reviews?${params}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setRatingFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Reviews</h1>
        <p className="text-muted-foreground">
          See what customers are saying about your products
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
            <p className="text-3xl font-bold">{stats.totalReviews}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
              <StarDisplay rating={Math.round(stats.avgRating)} size="md" />
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Rating Breakdown</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((r) => (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{r}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-yellow-400 h-1.5 rounded-full"
                      style={{
                        width:
                          stats.totalReviews > 0
                            ? `${((stats.ratingCounts[r] || 0) / stats.totalReviews) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-muted-foreground">
                    {stats.ratingCounts[r] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={ratingFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by rating" />
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
        {pagination && (
          <p className="text-sm text-muted-foreground">
            {pagination.total} review{pagination.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
            <p className="text-muted-foreground text-sm">
              {ratingFilter !== "all"
                ? `No ${ratingFilter}-star reviews found.`
                : "Customer reviews will appear here after they confirm delivery."}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start gap-4">
                {/* Product thumbnail */}
                <Link href={`/products/${review.product.slug}`} className="shrink-0">
                  {review.product.image ? (
                    <div className="relative w-14 h-14 rounded-md overflow-hidden border bg-muted">
                      <Image
                        src={review.product.image}
                        alt={review.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-md border bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {review.product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StarDisplay rating={review.rating} />
                        <Badge variant="secondary" className="text-xs py-0">
                          {review.rating}/5
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p>{review.customer.name}</p>
                      <p>
                        {new Date(review.createdAt).toLocaleDateString("en-LK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {review.comment}
                    </p>
                  )}
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
    </div>
  );
}
