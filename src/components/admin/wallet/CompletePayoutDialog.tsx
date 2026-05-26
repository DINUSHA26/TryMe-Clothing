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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useToast } from "@/hooks/use-toast";

interface CompletePayoutDialogProps {
  payout: PayoutWithVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CompletePayoutDialog({
  payout,
  open,
  onOpenChange,
  onSuccess,
}: CompletePayoutDialogProps) {
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!payout) return;

    // Validate transaction reference
    if (!transactionRef.trim()) {
      toast({
        title: "Transaction Reference Required",
        description: "Please enter the bank transaction reference number.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);

    try {
      const response = await fetch(
        `/api/admin/payouts/${payout.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionRef: transactionRef.trim(),
            notes: notes.trim() || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to complete payout");
      }

      toast({
        title: "Payout Completed",
        description: `Payout of ${formatCurrency(
          payout.amount
        )} has been marked as completed. The vendor has been notified.`,
      });

      // Reset form
      setTransactionRef("");
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error completing payout:", error);
      toast({
        title: "Completion Failed",
        description: error.message || "Failed to complete payout",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (!payout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Complete Payout
          </DialogTitle>
          <DialogDescription>
            Mark this payout as completed after successfully transferring the
            funds to the vendor&apos;s bank account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Transaction Reference (Required) */}
          <div className="space-y-2">
            <Label htmlFor="transactionRef">
              Bank Transaction Reference <span className="text-red-500">*</span>
            </Label>
            <Input
              id="transactionRef"
              placeholder="e.g., TXN123456789"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              disabled={isCompleting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the reference number from your bank transfer confirmation.
            </p>
          </div>

          {/* Completion Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Completion Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any completion notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isCompleting}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be visible to the vendor.
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-semibold text-blue-900">
              📌 What happens next:
            </p>
            <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Payout status will change to COMPLETED</li>
              <li>
                Vendor&apos;s totalWithdrawn will increase by{" "}
                {formatCurrency(payout.amount)}
              </li>
              <li>Vendor will receive a notification email</li>
              <li>Transaction reference will be recorded for audit</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCompleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !transactionRef.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Completed
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
