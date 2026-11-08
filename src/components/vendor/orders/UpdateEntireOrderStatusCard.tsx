/**
 * Update Entire Order Status Card
 * Allows vendors and ads sellers to change the status of the entire order (all items) in one single click
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
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
  Truck,
  PackageCheck,
  CreditCard,
  Ban,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface UpdateEntireOrderStatusCardProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  totalItemsCount: number;
  isWebsiteOrder?: boolean;
  apiEndpoint?: string;
  onSuccess?: () => void;
}

export function UpdateEntireOrderStatusCard({
  orderId,
  orderNumber,
  currentStatus,
  totalItemsCount,
  isWebsiteOrder = false,
  apiEndpoint,
  onSuccess,
}: UpdateEntireOrderStatusCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultApiEndpoint = apiEndpoint || `/api/vendor/orders/${orderId}/status`;

  const getAvailableStatuses = () => {
    // 1. Direct website orders with pending payment
    if (
      isWebsiteOrder &&
      (currentStatus === "PENDING_PAYMENT" || currentStatus === "PENDING_VERIFICATION")
    ) {
      return [
        {
          value: "PAYMENT_CONFIRMED",
          label: "Confirm Payment / Verify Order",
          icon: CreditCard,
        },
        {
          value: "CANCELLED",
          label: "Cancel Entire Order (Restores Stock)",
          icon: Ban,
        },
      ];
    }

    // 2. Sequential lifecycle: Payment Confirmed -> Processing -> Shipped -> Delivered -> Completed
    switch (currentStatus) {
      case "PENDING_PAYMENT":
      case "PENDING_VERIFICATION":
        // For marketplace orders, vendor waits for admin verification
        return [];

      case "PAYMENT_CONFIRMED":
        return [
          {
            value: "PROCESSING",
            label: "Mark All as Processing / Packing",
            icon: Clock,
          },
          {
            value: "CANCELLED",
            label: isWebsiteOrder
              ? "Cancel Entire Order (Restores Stock)"
              : "Cancel Entire Order",
            icon: Ban,
          },
        ];

      case "PROCESSING":
        return [
          {
            value: "SHIPPED",
            label: "Mark All as Shipped / Dispatched",
            icon: Truck,
          },
          {
            value: "CANCELLED",
            label: isWebsiteOrder
              ? "Cancel Entire Order (Restores Stock)"
              : "Cancel Entire Order",
            icon: Ban,
          },
        ];

      case "SHIPPED":
        return [
          {
            value: "DELIVERED",
            label: isWebsiteOrder
              ? "Mark as Delivered to Customer"
              : "Mark All as Delivered",
            icon: PackageCheck,
          },
        ];

      case "DELIVERED":
      case "DELIVERY_CONFIRMED":
        return [
          {
            value: "COMPLETED",
            label: isWebsiteOrder
              ? "Mark as Completed & Paid"
              : "Mark All as Completed",
            icon: CheckCircle2,
          },
        ];

      case "COMPLETED":
      case "CANCELLED":
      default:
        // Terminal states - cannot advance further
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      setError("Please select a new order status");
      return;
    }

    if (!isWebsiteOrder && status === "SHIPPED" && !trackingNumber.trim()) {
      setError("Tracking number is required when marking as shipped");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(defaultApiEndpoint, {
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
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to update order status");
        return;
      }

      toast.success(
        `Order #${orderNumber} and all ${totalItemsCount} item(s) updated to ${status.replace(/_/g, " ")}!`
      );

      setStatus("");
      setTrackingNumber("");
      setTrackingUrl("");
      setNote("");

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStatusObj = availableStatuses.find((s) => s.value === status);

  return (
    <div className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-blue-500/5 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 mb-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">
                Update Entire Order Status (All Items)
              </h3>
              <span className="hidden sm:inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                One-Click Batch Update
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Change status for all {totalItemsCount} ordered item(s) at once instead of updating one by one.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-medium text-muted-foreground">
            Current Order Status:
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground border">
            {currentStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {availableStatuses.length === 0 ? (
        <div className="py-3 px-4 rounded-xl bg-muted/50 border text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {currentStatus === "COMPLETED"
              ? "This order has been completed. No further status changes are required."
              : currentStatus === "CANCELLED"
              ? "This order is cancelled."
              : `Order is currently ${currentStatus.replace(/_/g, " ")}. Further status changes will unlock after customer confirmation.`}
          </span>
        </div>
      ) : (
        /* Update Form */
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="entire-order-status" className="font-bold text-xs">
              Select New Order Status <span className="text-destructive">*</span>
            </Label>
            <Select value={status} onValueChange={(val) => setStatus(val)}>
              <SelectTrigger id="entire-order-status" className="h-10 font-medium">
                <SelectValue placeholder="Choose new status for entire order..." />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="font-medium">
                    <div className="flex items-center gap-2">
                      <s.icon className="w-4 h-4 text-primary" />
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Info / Item Scope Reminder */}
          <div className="flex items-center px-4 py-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">
                Scope: All {totalItemsCount} Item(s) in Order #{orderNumber}
              </p>
              <p className="text-[11px] mt-0.5 text-muted-foreground">
                Submitting this form synchronizes the order header and all line items simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Courier / Tracking Fields (if SHIPPED selected) */}
        {status === "SHIPPED" && (
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-foreground">
                Dispatch &amp; Tracking Information (Applies to All Items)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entire-tracking-no" className="text-xs font-semibold">
                  Courier Tracking Number{" "}
                  {!isWebsiteOrder ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  )}
                </Label>
                <Input
                  id="entire-tracking-no"
                  type="text"
                  placeholder="e.g. TRK987654321 / Koombiyo / Pronto"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  maxLength={50}
                  disabled={isLoading}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entire-tracking-url" className="text-xs font-semibold">
                  Tracking Web Link <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="entire-tracking-url"
                  type="url"
                  placeholder="https://tracking.courier.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  maxLength={200}
                  disabled={isLoading}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Note (Optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="entire-status-note" className="text-xs font-semibold">
            Status Note / Courier Remarks <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="entire-status-note"
            placeholder="Add any payment verification note, courier handoff details, or order comment..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            disabled={isLoading}
            className="text-xs"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <Button
            type="submit"
            disabled={
              isLoading ||
              !status ||
              (!isWebsiteOrder && status === "SHIPPED" && !trackingNumber.trim())
            }
            className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {selectedStatusObj
              ? `Update All ${totalItemsCount} Items to "${selectedStatusObj.value.replace(/_/g, " ")}"`
              : "Update Entire Order Status"}
          </Button>

          <span className="text-[11px] text-muted-foreground">
            {totalItemsCount > 1
              ? `Note: You can still customize any specific item separately below if needed.`
              : `Applies directly to Order #${orderNumber}.`}
          </span>
        </div>
      </form>
      )}
    </div>
  );
}

