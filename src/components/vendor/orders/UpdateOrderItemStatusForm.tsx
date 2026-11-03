/**
 * Update Order Item Status Form
 * Allows vendor to update item status and add tracking information
 * Supports full lifecycle management for Direct Website Orders (COD / Bank Deposit)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

interface UpdateOrderItemStatusFormProps {
  apiEndpointPrefix?: string;
  orderItemId: string;
  currentStatus: OrderStatus;
  productName: string;
  isWebsiteOrder?: boolean;
  onSuccess?: () => void;
}

export function UpdateOrderItemStatusForm({
  orderItemId,
  currentStatus,
  productName,
  isWebsiteOrder = false,
  onSuccess,
  apiEndpointPrefix = "/api/vendor/orders/items",
}: UpdateOrderItemStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAvailableStatuses = () => {
    if (isWebsiteOrder) {
      // Full lifecycle control for Direct Website Orders
      const allWebsiteStatuses = [
        { value: "PAYMENT_CONFIRMED", label: "Confirm Payment / Verify Order" },
        { value: "PROCESSING", label: "Mark as Processing / Packing" },
        { value: "SHIPPED", label: "Mark as Shipped / Dispatched" },
        { value: "DELIVERED", label: "Mark as Delivered to Customer" },
        { value: "COMPLETED", label: "Mark as Completed & Paid" },
        { value: "CANCELLED", label: "Cancel Order (Restores Stock)" },
      ];
      return allWebsiteStatuses.filter((s) => s.value !== currentStatus);
    }

    // Standard TryMe Marketplace transitions
    if (currentStatus === "PAYMENT_CONFIRMED") {
      return [{ value: "PROCESSING", label: "Mark as Processing" }];
    } else if (currentStatus === "PROCESSING") {
      return [{ value: "SHIPPED", label: "Mark as Shipped" }];
    }
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      setError("Please select a status");
      return;
    }

    if (!isWebsiteOrder && status === "SHIPPED" && !trackingNumber) {
      setError("Tracking number is required when marking as shipped");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiEndpointPrefix}/${orderItemId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            trackingNumber: trackingNumber.trim() || null,
            trackingUrl: trackingUrl.trim() || null,
            note: note.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to update status");
        return;
      }

      toast.success(`Order status updated to ${status.replace(/_/g, " ")}`);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }

      setStatus("");
      setTrackingNumber("");
      setTrackingUrl("");
      setNote("");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (availableStatuses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This item cannot be updated further. Current status:{" "}
          {currentStatus.replace(/_/g, " ").toLowerCase()}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Updating status for:
        </p>
        <p className="font-semibold text-sm">{productName}</p>
      </div>

      {/* Status Select */}
      <div className="space-y-2">
        <Label htmlFor="status">
          New Status <span className="text-destructive">*</span>
        </Label>
        <Select value={status} onValueChange={(val) => setStatus(val)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select new order status" />
          </SelectTrigger>
          <SelectContent>
            {availableStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tracking Number (For SHIPPED) */}
      {status === "SHIPPED" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              Tracking Number{" "}
              {!isWebsiteOrder ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground">(optional)</span>
              )}
            </Label>
            <Input
              id="trackingNumber"
              type="text"
              placeholder="e.g., TRK123456789 / Courier Ref"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              maxLength={40}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingUrl">
              Tracking URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="trackingUrl"
              type="url"
              placeholder="https://tracking.example.com/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              maxLength={200}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Note (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="note">
          Status Note <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="Add any courier details, payment confirmation note, or cancellation reason..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={
          isLoading ||
          !status ||
          (!isWebsiteOrder && status === "SHIPPED" && !trackingNumber.trim())
        }
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mr-2" />
        )}
        Update Order Status
      </Button>
    </form>
  );
}
