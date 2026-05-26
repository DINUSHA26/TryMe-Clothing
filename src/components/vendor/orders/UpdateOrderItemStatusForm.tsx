/**
 * Update Order Item Status Form
 * Allows vendor to update item status and add tracking information
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
import { AlertCircle, Loader2 } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface UpdateOrderItemStatusFormProps {
  orderItemId: string;
  currentStatus: OrderStatus;
  productName: string;
  onSuccess?: () => void;
}

export function UpdateOrderItemStatusForm({
  orderItemId,
  currentStatus,
  productName,
  onSuccess,
}: UpdateOrderItemStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"PROCESSING" | "SHIPPED" | "">(
    currentStatus === "PAYMENT_CONFIRMED" ? "" : ""
  );
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Determine available status options
  const getAvailableStatuses = () => {
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

    if (status === "SHIPPED" && !trackingNumber) {
      setError("Tracking number is required when marking as shipped");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/vendor/orders/items/${orderItemId}/status`,
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

      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }

      // Reset form
      setStatus("");
      setTrackingNumber("");
      setTrackingUrl("");
      setNote("");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If no available statuses, show message
  if (availableStatuses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This item cannot be updated further. Current status:{" "}
          {currentStatus.replace("_", " ").toLowerCase()}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Name */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Updating status for:
        </p>
        <p className="font-medium">{productName}</p>
      </div>

      {/* Status Select */}
      <div className="space-y-2">
        <Label htmlFor="status">
          New Status <span className="text-destructive">*</span>
        </Label>
        <Select value={status} onValueChange={(val) => setStatus(val as any)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select new status" />
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

      {/* Tracking Number (Required for SHIPPED) */}
      {status === "SHIPPED" && (
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">
            Tracking Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="trackingNumber"
            type="text"
            placeholder="e.g., TRK123456789"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            maxLength={30}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Tracking URL (Optional) */}
      {status === "SHIPPED" && (
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
      )}

      {/* Note (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="note">
          Note <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="Add any additional information..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {note.length}/500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={
          isLoading ||
          !status ||
          (status === "SHIPPED" && !trackingNumber.trim())
        }
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update Status
      </Button>
    </form>
  );
}
