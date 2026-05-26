"use client";

import { useState } from "react";
import { PayoutWithVendor } from "@/types/wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useToast } from "@/hooks/use-toast";

interface FailPayoutDialogProps {
  payout: PayoutWithVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FailPayoutDialog({
  payout,
  open,
  onOpenChange,
  onSuccess,
}: FailPayoutDialogProps) {
  const [reason, setReason] = useState("");
  const [isFailing, setIsFailing] = useState(false);
  const { toast } = useToast();

  const handleFail = async () => {
    if (!payout) return;

    // Validate reason
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description:
          "Please provide a reason for failing this payout. This will be visible to the vendor.",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 10) {
      toast({
        title: "Reason Too Short",
        description: "Please provide a more detailed reason (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsFailing(true);

    try {
      const response = await fetch(`/api/admin/payouts/${payout.id}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fail payout");
      }

      toast({
        title: "Payout Failed",
        description: `Payout has been marked as failed. ${formatCurrency(
          payout.amount
        )} has been refunded to the vendor's available balance.`,
      });

      // Reset form
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error failing payout:", error);
      toast({
        title: "Operation Failed",
        description: error.message || "Failed to mark payout as failed",
        variant: "destructive",
      });
    } finally {
      setIsFailing(false);
    }
  };

  if (!payout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Fail Payout
          </DialogTitle>
          <DialogDescription>
            Mark this payout as failed if the bank transfer could not be
            completed. The amount will be refunded to the vendor&apos;s wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Refund Action</p>
              <p className="text-xs mt-1">
                Failing this payout will refund {formatCurrency(payout.amount)}{" "}
                to the vendor&apos;s available balance. The vendor can then
                request a new payout.
              </p>
            </div>
          </div>

          {/* Payout Summary */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vendor:</span>
              <span className="text-sm font-medium">
                {payout.vendor.businessName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="text-lg font-bold">
                {formatCurrency(payout.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bank Account:</span>
              <span>
                {payout.bankName} - {payout.accountNumber}
              </span>
            </div>
          </div>

          {/* Balance After Refund */}
          <div className="rounded-lg border p-3 space-y-2">
            <h4 className="text-sm font-semibold">Balance After Refund</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Available:
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(payout.wallet.availableBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                After Refund:
              </span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(payout.wallet.availableBalance + payout.amount)}
              </span>
            </div>
          </div>

          {/* Failure Reason (Required) */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Failure <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Invalid bank account details, Bank transfer declined, Account verification failed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isFailing}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for failing this payout. The vendor will
              see this message (minimum 10 characters).
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-semibold text-blue-900">
              📌 What happens next:
            </p>
            <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Payout status will change to FAILED</li>
              <li>
                {formatCurrency(payout.amount)} will be refunded to available
                balance
              </li>
              <li>Vendor will receive a notification with your reason</li>
              <li>Vendor can request a new payout with corrected details</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isFailing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFail}
            disabled={isFailing || !reason.trim() || reason.trim().length < 10}
            variant="destructive"
          >
            {isFailing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Failing Payout...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Fail & Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
