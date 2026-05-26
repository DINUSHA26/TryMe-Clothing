/**
 * Override Status Dialog Component
 * Allows admin to override order status to any status with reason
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface OverrideStatusDialogProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DELIVERY_CONFIRMED", label: "Delivery Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURN_REQUESTED", label: "Return Requested" },
  { value: "RETURNED", label: "Returned" },
  { value: "DISPUTED", label: "Disputed" },
];

export function OverrideStatusDialog({
  orderId,
  orderNumber,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: OverrideStatusDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!status) {
      setError("Please select a status");
      return;
    }

    if (status === currentStatus) {
      setError("Order is already in this status");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Please provide a reason of at least 10 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to override status");
        return;
      }

      // Success
      onOpenChange(false);
      setStatus("");
      setReason("");
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
            <Shield className="w-5 h-5 text-orange-600" />
            Override Order Status
          </DialogTitle>
          <DialogDescription>
            Admin override for order {orderNumber}. This will update the order
            status and all order items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action will override all business
              rules and update the order status directly. Use with extreme
              caution.
            </AlertDescription>
          </Alert>

          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm font-medium">
              {currentStatus.replace(/_/g, " ")}
            </p>
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              New Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as OrderStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === currentStatus}
                  >
                    {option.label}
                    {option.value === currentStatus && " (Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you are overriding this order status..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters (minimum 10)
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !status || reason.trim().length < 10}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Override Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
