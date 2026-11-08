/**
 * Confirm Delivery Dialog Component
 * CRITICAL: Triggers fund release from pendingBalance to availableBalance
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ConfirmDeliveryDialogProps {
  orderId: string;
  orderNumber: string;
  vendorId?: string;
  vendorName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConfirmDeliveryDialog({
  orderId,
  orderNumber,
  vendorId,
  vendorName,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmDeliveryDialogProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(vendorId ? { vendorId } : {}),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to confirm delivery");
        return;
      }

      // Success
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {vendorName ? `Confirm ${vendorName} Delivery` : "Confirm Delivery"}
          </DialogTitle>
          <DialogDescription>
            {vendorName
              ? `Please confirm that you have received your package from ${vendorName} for order ${orderNumber}.`
              : `Please confirm that you have received order ${orderNumber} and are satisfied with your purchase.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> By confirming delivery, you acknowledge
              that you have received {vendorName ? `all items from ${vendorName}` : "all items in this order"} in good condition. This will
              release payment to {vendorName ? `the store (${vendorName})` : "the vendor(s)"}.
            </AlertDescription>
          </Alert>

          {/* Return Policy Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have 24 hours from confirmation to request a return if needed.
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Not Yet
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
