"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AdVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adTitle: string;
  onActionComplete: () => void;
}

export function AdVerificationModal({
  isOpen,
  onClose,
  adId,
  adTitle,
  onActionComplete,
}: AdVerificationModalProps) {
  const [status, setStatus] = useState<"ACTIVE" | "REJECTED">("ACTIVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "REJECTED" && !rejectionReason.trim()) {
      setError("Please specify a reason for rejecting this ad.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/marketplace/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
          adminNote: adminNote || undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || "Failed to update ad status");
        return;
      }

      onActionComplete();
      onClose();
    } catch (err) {
      console.error("Ad review error:", err);
      setError("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Moderate Ad</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1 truncate">
            Reviewing ad: <strong>{adTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Decision */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Moderation Action</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus("ACTIVE");
                  setError("");
                }}
                className={`py-3 px-4 border rounded-xl text-center text-sm font-semibold transition-all ${
                  status === "ACTIVE"
                    ? "border-green-600 bg-green-50/50 text-green-700 font-bold scale-[1.01]"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                Approve Ad
              </button>
              <button
                type="button"
                onClick={() => setStatus("REJECTED")}
                className={`py-3 px-4 border rounded-xl text-center text-sm font-semibold transition-all ${
                  status === "REJECTED"
                    ? "border-red-600 bg-red-50/50 text-red-700 font-bold scale-[1.01]"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                Reject Ad
              </button>
            </div>
          </div>

          {/* Rejection Reason */}
          {status === "REJECTED" && (
            <div className="space-y-1.5 animate-fadeIn">
              <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Specify why the ad was rejected (this will be sent to the seller)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] bg-gray-50 border-gray-200 focus:bg-white transition-all text-sm rounded-xl"
              />
            </div>
          )}

          {/* Admin Note */}
          <div className="space-y-1.5">
            <Label htmlFor="adminNote" className="text-sm font-medium text-gray-700">
              Admin Notes <span className="text-gray-400 font-normal">(Internal Only)</span>
            </Label>
            <Textarea
              id="adminNote"
              placeholder="Add internal notes about this ad..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white transition-all text-sm rounded-xl"
            />
          </div>

          {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}

          <DialogFooter className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-3 sm:space-x-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`rounded-xl text-white ${
                status === "ACTIVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm decision</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
