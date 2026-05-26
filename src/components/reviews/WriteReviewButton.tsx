"use client";

import { useState } from "react";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
}

interface WriteReviewButtonProps {
  orderItemId: string;
  productName: string;
  existingReview?: ExistingReview | null;
}

export function WriteReviewButton({
  orderItemId,
  productName,
  existingReview,
}: WriteReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Track in-session changes so the button reflects the latest state
  const [localReview, setLocalReview] = useState<ExistingReview | null>(
    existingReview || null
  );

  const hasReview = localReview || submitted;

  function handleSuccess(review: ExistingReview) {
    setLocalReview(review);
    setSubmitted(true);
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-2 h-8 text-xs gap-1.5"
      >
        {hasReview ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Edit Review
            {localReview && (
              <span className="flex ml-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < localReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </span>
            )}
          </>
        ) : (
          <>
            <Star className="w-3.5 h-3.5" />
            Write a Review
          </>
        )}
      </Button>

      <ReviewDialog
        open={open}
        onOpenChange={setOpen}
        orderItemId={orderItemId}
        productName={productName}
        existingReview={localReview}
        onSuccess={handleSuccess}
      />
    </>
  );
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: string;
  productName: string;
  existingReview: ExistingReview | null;
  onSuccess: (review: ExistingReview) => void;
}

function ReviewDialog({
  open,
  onOpenChange,
  orderItemId,
  productName,
  existingReview,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success(
        existingReview ? "Review updated!" : "Review submitted — thank you!"
      );
      onSuccess({ id: data.data.review.id, rating, comment: comment.trim() || null });
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Edit Your Review" : "Write a Review"}
          </DialogTitle>
          <DialogDescription>
            Share your experience with{" "}
            <span className="font-medium">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHovered(0)}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHovered(value)}
                    className="p-0.5 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        value <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Comment{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="review-comment"
              placeholder="Tell others about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
