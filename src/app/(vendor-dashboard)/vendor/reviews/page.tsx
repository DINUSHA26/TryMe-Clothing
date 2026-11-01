"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  Package,
  Store,
  Globe,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquareReply,
  Trash2,
  Plus,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";

interface Review {
  id: string;
  source?: "tryme" | "website";
  rating: number;
  title?: string | null;
  comment: string | null;
  createdAt: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  verifiedPurchase?: boolean;
  vendorReply?: string | null;
  repliedAt?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
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
  const [source, setSource] = useState<"tryme" | "website">("tryme");
  const [channelCounts, setChannelCounts] = useState<{ tryme: number; website: number }>({
    tryme: 0,
    website: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Reply state
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add Website Review modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newProductName, setNewProductName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newIsFeatured, setNewIsFeatured] = useState(true);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [page, ratingFilter, source]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        source,
      });
      if (ratingFilter !== "all") params.set("rating", ratingFilter);

      const res = await fetch(`/api/vendor/reviews?${params}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
        if (data.data.channelCounts) {
          setChannelCounts(data.data.channelCounts);
        }
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

  const handleSourceChange = (newSource: "tryme" | "website") => {
    setSource(newSource);
    setPage(1);
  };

  const handleUpdateWebsiteReview = async (
    reviewId: string,
    payload: {
      isVisible?: boolean;
      isFeatured?: boolean;
      vendorReply?: string;
      action?: "delete";
    }
  ) => {
    setActionLoadingId(reviewId);
    try {
      const res = await fetch("/api/vendor/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, ...payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Review updated");
        setReplyingId(null);
        fetchReviews();
      } else {
        toast.error(json.error || "Failed to update review");
      }
    } catch {
      toast.error("Error updating review");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddWebsiteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newComment.trim()) {
      toast.error("Customer name and review comment are required");
      return;
    }
    setIsSubmittingNew(true);
    try {
      const res = await fetch("/api/vendor/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newCustomerName,
          rating: newRating,
          productName: newProductName || "General Store Review",
          title: newTitle,
          comment: newComment,
          isFeatured: newIsFeatured,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Website review added!");
        setAddModalOpen(false);
        setNewCustomerName("");
        setNewRating(5);
        setNewProductName("");
        setNewTitle("");
        setNewComment("");
        setSource("website");
        fetchReviews();
      } else {
        toast.error(json.error || "Failed to add review");
      }
    } catch {
      toast.error("Failed to add review");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Reviews</h1>
          <p className="text-muted-foreground">
            Manage TryMe.lk marketplace reviews and your standalone website reviews separately
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Website Review / Testimonial
        </Button>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-2 rounded-2xl border">
        <button
          type="button"
          onClick={() => handleSourceChange("tryme")}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
            source === "tryme"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background hover:bg-muted/60 text-foreground"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                source === "tryme" ? "bg-white/20" : "bg-blue-500/10 text-blue-600"
              }`}
            >
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">TryMe.lk Marketplace Reviews</p>
              <p
                className={`text-xs ${
                  source === "tryme" ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                Verified buyer reviews from TryMe.lk orders
              </p>
            </div>
          </div>
          <Badge
            variant={source === "tryme" ? "secondary" : "outline"}
            className="font-bold text-xs"
          >
            {channelCounts.tryme}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleSourceChange("website")}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
            source === "website"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-background hover:bg-muted/60 text-foreground"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                source === "website" ? "bg-white/20" : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">My Website Direct Reviews</p>
              <p
                className={`text-xs ${
                  source === "website" ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                Product & store reviews submitted on your standalone website
              </p>
            </div>
          </div>
          <Badge
            variant={source === "website" ? "secondary" : "outline"}
            className="font-bold text-xs"
          >
            {channelCounts.website}
          </Badge>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">
              {source === "website" ? "Website Reviews" : "Marketplace Reviews"}
            </p>
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
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

        {source === "website" && (
          <p className="text-xs text-muted-foreground">
            Tip: You can hide/show reviews, feature them on your website homepage, or post an official store reply.
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
          <div className="border rounded-lg p-12 text-center bg-card">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">
              {source === "website"
                ? "No direct website reviews yet"
                : "No marketplace reviews yet"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {ratingFilter !== "all"
                ? `No ${ratingFilter}-star reviews found.`
                : source === "website"
                ? "Customers can write reviews directly on your 6/12-page website product pages, or you can add customer testimonials using the button above."
                : "Customer reviews from TryMe.lk orders will appear here after they confirm delivery."}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`border rounded-xl p-4 bg-card transition-all ${
                source === "website" && review.isVisible === false
                  ? "opacity-60 border-dashed"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Product thumbnail */}
                {review.product.slug ? (
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
                ) : (
                  <div className="w-14 h-14 rounded-md border bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {review.product.slug ? (
                          <Link
                            href={`/products/${review.product.slug}`}
                            className="font-semibold hover:underline line-clamp-1"
                          >
                            {review.product.name}
                          </Link>
                        ) : (
                          <span className="font-semibold line-clamp-1">
                            {review.product.name}
                          </span>
                        )}

                        {source === "website" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] py-0">
                            My Website
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0">
                            TryMe.lk
                          </Badge>
                        )}

                        {source === "website" && review.isFeatured && (
                          <Badge className="bg-amber-500 text-white text-[10px] py-0 gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Featured on Home
                          </Badge>
                        )}

                        {source === "website" && review.isVisible === false && (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Hidden from Website
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <StarDisplay rating={review.rating} />
                        <Badge variant="secondary" className="text-xs py-0">
                          {review.rating}/5
                        </Badge>
                        {review.title && (
                          <span className="text-xs font-semibold text-foreground">
                            — {review.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p className="font-medium text-foreground">{review.customer.name}</p>
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
                    <p className="mt-2 text-sm text-foreground/90 whitespace-pre-line">
                      {review.comment}
                    </p>
                  )}

                  {/* Vendor Reply Display */}
                  {review.vendorReply && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/60 border-l-4 border-emerald-600 text-xs space-y-1">
                      <p className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Store Owner Response:
                      </p>
                      <p className="text-muted-foreground">{review.vendorReply}</p>
                    </div>
                  )}

                  {/* Advanced Controls for Direct Website Reviews */}
                  {source === "website" && (
                    <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === review.id}
                          onClick={() =>
                            handleUpdateWebsiteReview(review.id, {
                              isVisible: review.isVisible === false ? true : false,
                            })
                          }
                          className="h-7 text-xs gap-1.5"
                        >
                          {review.isVisible === false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              Show on Website
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              Hide
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant={review.isFeatured ? "default" : "outline"}
                          disabled={actionLoadingId === review.id}
                          onClick={() =>
                            handleUpdateWebsiteReview(review.id, {
                              isFeatured: !review.isFeatured,
                            })
                          }
                          className={`h-7 text-xs gap-1.5 ${
                            review.isFeatured
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : ""
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {review.isFeatured ? "Featured" : "Feature on Home"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (replyingId === review.id) {
                              setReplyingId(null);
                            } else {
                              setReplyingId(review.id);
                              setReplyText(review.vendorReply || "");
                            }
                          }}
                          className="h-7 text-xs gap-1.5"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" />
                          {review.vendorReply ? "Edit Reply" : "Reply"}
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionLoadingId === review.id}
                        onClick={() => {
                          if (confirm("Delete this website review?")) {
                            handleUpdateWebsiteReview(review.id, { action: "delete" });
                          }
                        }}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}

                  {/* Inline Reply Editor */}
                  {source === "website" && replyingId === review.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your official reply to this customer..."
                        className="text-xs h-8"
                      />
                      <Button
                        size="sm"
                        disabled={actionLoadingId === review.id}
                        onClick={() =>
                          handleUpdateWebsiteReview(review.id, {
                            vendorReply: replyText,
                          })
                        }
                        className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Send className="w-3 h-3" /> Save Reply
                      </Button>
                    </div>
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

      {/* Add Website Review Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Website Review / Testimonial</DialogTitle>
            <DialogDescription>
              Add a customer review or WhatsApp feedback directly to your standalone website.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddWebsiteReview} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                required
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Kasun Perera"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rating *</Label>
                <Select
                  value={String(newRating)}
                  onValueChange={(v) => setNewRating(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars (Excellent)</SelectItem>
                    <SelectItem value="4">4 Stars (Good)</SelectItem>
                    <SelectItem value="3">3 Stars (Average)</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Product / Service Name</Label>
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Optional product name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Review Headline (Optional)</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Fast delivery and genuine product!"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Review Comment *</Label>
              <Textarea
                required
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write what the customer said..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newIsFeatured}
                onChange={(e) => setNewIsFeatured(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Feature this review on Website Homepage</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingNew}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingNew ? "Saving..." : "Add Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
