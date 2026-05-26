/**
 * Request Return Dialog Component
 * Allows customer to request return within 24h of delivery confirmation
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, PackageX } from "lucide-react";

interface RequestReturnDialogProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  orderItemId?: string;
}

export function RequestReturnDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onSuccess,
  orderItemId,
}: RequestReturnDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      setError("Please provide a reason of at least 10 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/request-return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim(),
          description: description.trim() || null,
          orderItemId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to request return");
        return;
      }

      // Success
      onOpenChange(false);
      setReason("");
      setDescription("");
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
            <PackageX className="w-5 h-5 text-orange-600" />
            Request Return
          </DialogTitle>
          <DialogDescription>
            Request a return for {orderItemId ? "this item" : `order ${orderNumber}`}. 
            Our team will review your request and respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Return Policy Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Returns must be requested within 24 hours
              of delivery confirmation. Return shipping costs are paid by the
              customer.
            </AlertDescription>
          </Alert>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="return-reason">
              Reason for return <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="return-reason"
              placeholder="e.g., Wrong size, damaged item, not as described..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Additional Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="return-description">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="return-description"
              placeholder="Provide any additional information that may help us process your return..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || reason.trim().length < 10}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
