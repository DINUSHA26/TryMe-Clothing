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
import { Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useToast } from "@/hooks/use-toast";

interface ProcessPayoutDialogProps {
  payout: PayoutWithVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProcessPayoutDialog({
  payout,
  open,
  onOpenChange,
  onSuccess,
}: ProcessPayoutDialogProps) {
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!payout) return;

    // Check if vendor has sufficient balance
    if (payout.wallet.availableBalance < payout.amount) {
      toast({
        title: "Insufficient Balance",
        description: `Vendor's available balance (${formatCurrency(
          payout.wallet.availableBalance
        )}) is less than the payout amount (${formatCurrency(
          payout.amount
        )}). Cannot process this payout.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/payouts/${payout.id}/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes.trim() || undefined }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process payout");
      }

      toast({
        title: "Payout Approved",
        description: `Payout of ${formatCurrency(
          payout.amount
        )} has been approved. The amount has been deducted from the vendor's wallet.`,
      });

      // Reset form
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process payout",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!payout) return null;

  const hasInsufficientBalance =
    payout.wallet.availableBalance < payout.amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Approve Payout Request</DialogTitle>
          <DialogDescription>
            Review the payout details and approve the request. The amount will
            be deducted from the vendor&apos;s available balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vendor Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Vendor Information</h4>
            <div className="rounded-lg border p-3 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Business:</span>{" "}
                <span className="font-medium">
                  {payout.vendor.businessName}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {payout.vendor.businessEmail}
              </p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Bank Details</h4>
            <div className="rounded-lg border p-3 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Bank:</span>{" "}
                <span className="font-medium">{payout.bankName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Account:</span>{" "}
                {payout.accountNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Holder:</span>{" "}
                {payout.accountHolder}
              </p>
              {payout.branchCode && (
                <p>
                  <span className="text-muted-foreground">Branch:</span>{" "}
                  {payout.branchCode}
                </p>
              )}
            </div>
          </div>

          {/* Amount & Balance Check */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Amount & Balance</h4>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Payout Amount:
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(payout.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Available Balance:
                </span>
                <span
                  className={`text-sm font-semibold ${
                    hasInsufficientBalance ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(payout.wallet.availableBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">
                  Balance After:
                </span>
                <span
                  className={`text-sm font-semibold ${
                    hasInsufficientBalance ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(
                    Math.max(0, payout.wallet.availableBalance - payout.amount)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Insufficient Balance</p>
                <p className="text-xs">
                  The vendor does not have enough available balance to process
                  this payout. Please check with the vendor or wait for more
                  funds to be released.
                </p>
              </div>
            </div>
          )}

          {/* Processing Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Processing Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payout approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be visible to the vendor.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || hasInsufficientBalance}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve & Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
