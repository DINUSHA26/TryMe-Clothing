"use client";

/**
 * Order Timeline Component
 * Displays order status history with sub-order / package filtering
 * when the order contains items from multiple shops.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, Store } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatus, UserRole } from "@prisma/client";

export interface StatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  createdBy: {
    email: string;
    role: UserRole | null;
  } | null;
}

export interface PackageOption {
  vendorId: string;
  vendorName: string;
  vendorSlug?: string;
  status?: OrderStatus;
  itemCount?: number;
}

interface OrderTimelineProps {
  orderId?: string;
  activeSubOrder?: string;
  statusHistory: StatusHistoryItem[];
  currentStatus: OrderStatus;
  packages?: PackageOption[];
}

export function OrderTimeline({
  orderId,
  activeSubOrder,
  statusHistory,
  currentStatus,
  packages = [],
}: OrderTimelineProps) {
  const router = useRouter();
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");

  // Keep internal selection synchronized with URL / props activeSubOrder
  useEffect(() => {
    if (!activeSubOrder || activeSubOrder === "all") {
      setSelectedVendorId("all");
    } else {
      const pLower = activeSubOrder.toLowerCase().trim();
      const matched = packages.find(
        (p) =>
          p.vendorId.toLowerCase() === pLower ||
          (p.vendorSlug && p.vendorSlug.toLowerCase() === pLower) ||
          p.vendorName.toLowerCase().replace(/\s+/g, "-") === pLower ||
          p.vendorName.toLowerCase() === pLower
      );
      if (matched) {
        setSelectedVendorId(matched.vendorId);
      } else {
        setSelectedVendorId("all");
      }
    }
  }, [activeSubOrder, packages]);

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    if (!orderId) return;

    if (vendorId === "all") {
      router.push(`/orders/${orderId}`, { scroll: false });
    } else {
      const pkg = packages.find((p) => p.vendorId === vendorId);
      const subOrderParam = pkg?.vendorSlug || vendorId;
      router.push(`/orders/${orderId}?subOrder=${encodeURIComponent(subOrderParam)}`, {
        scroll: false,
      });
    }
  };

  if (statusHistory.length === 0) {
    return (
      <div className="border rounded-2xl p-6 text-center text-muted-foreground bg-card">
        No status history available
      </div>
    );
  }

  // Reverse to show most recent first
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter history if a specific package/vendor is selected
  const filteredHistory =
    selectedVendorId === "all"
      ? sortedHistory
      : sortedHistory.filter((item) => {
          const targetPkg = packages.find((p) => p.vendorId === selectedVendorId);
          if (!targetPkg) return true;

          const otherPkgs = packages.filter((p) => p.vendorId !== selectedVendorId);
          const noteRaw = item.note || "";
          const noteLower = noteRaw.toLowerCase();
          const targetNameLower = targetPkg.vendorName.toLowerCase();
          const targetSlugLower = targetPkg.vendorSlug?.toLowerCase();

          // 1. If note explicitly mentions the target vendor (or [Package: VendorName]), keep it
          const mentionsTarget =
            noteLower.includes(targetNameLower) ||
            (targetSlugLower && noteLower.includes(targetSlugLower));

          // 2. If note explicitly mentions any OTHER vendor, exclude it
          const mentionsOther = otherPkgs.some(
            (p) =>
              noteLower.includes(p.vendorName.toLowerCase()) ||
              (p.vendorSlug && noteLower.includes(p.vendorSlug.toLowerCase()))
          );

          if (mentionsTarget) return true;
          if (mentionsOther) return false;

          // 3. Platform / Universal Order Lifecycle Events (apply to all packages)
          const isUniversalEvent =
            noteLower.includes("order created") ||
            noteLower.includes("bank transfer") ||
            noteLower.includes("payment confirmed") ||
            noteLower.includes("approved bank transfer") ||
            noteLower.includes("online payment") ||
            item.status === "PENDING_PAYMENT" ||
            item.status === "PENDING_VERIFICATION";

          if (isUniversalEvent) {
            return true;
          }

          // 4. In multi-vendor orders, exclude general aggregated parent-status updates
          // (like "Order status updated based on item statuses") from single package views
          if (
            packages.length > 1 &&
            noteLower.includes("order status updated based on item statuses")
          ) {
            return false;
          }

          // 5. Legacy notes without vendor name (e.g. "Entire order (1 items) marked as COMPLETED by vendor")
          // If another package matches this status and target package does NOT, exclude it
          if (
            otherPkgs.some((other) => other.status === item.status) &&
            targetPkg.status !== item.status
          ) {
            return false;
          }

          return true;
        });

  return (
    <div className="border rounded-2xl p-5 sm:p-6 bg-card shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg text-foreground">Order Timeline</h3>
          <p className="text-xs text-muted-foreground">
            Real-time fulfillment and delivery tracking updates
          </p>
        </div>

        {/* Package/Sub-Order Filter Tabs when multi-vendor */}
        {packages.length > 1 && (
          <div className="inline-flex flex-wrap p-1 bg-muted rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleSelectVendor("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedVendorId === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Events
            </button>
            {packages.map((pkg) => (
              <button
                key={pkg.vendorId}
                type="button"
                onClick={() => handleSelectVendor(pkg.vendorId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedVendorId === pkg.vendorId
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Store className="w-3 h-3" />
                <span>{pkg.vendorName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative pl-2">
        {/* Vertical line */}
        <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-border" />

        {/* Timeline items */}
        <div className="space-y-6">
          {filteredHistory.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No specific events recorded for this package yet.
            </div>
          ) : (
            filteredHistory.map((item, index) => {
              const isFirst = index === 0;
              const isCurrent = item.status === currentStatus;

              // Check if note mentions any of our packages
              const mentionedPackage = packages.find(
                (p) =>
                  item.note &&
                  (item.note.toLowerCase().includes(p.vendorName.toLowerCase()) ||
                    (p.vendorSlug && item.note.toLowerCase().includes(p.vendorSlug.toLowerCase())))
              );

              // Clean display note (strip [Package: ...] prefix if present)
              const displayNote = item.note
                ? item.note.replace(/^\[Package:\s*[^\]]+\]\s*/i, "")
                : null;

              return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10">
                    {isFirst ? (
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Circle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <OrderStatusBadge status={item.status} />

                      {mentionedPackage && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          <Store className="w-3 h-3" />
                          <span>{mentionedPackage.vendorName} Package</span>
                        </span>
                      )}

                      {isFirst && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          (Latest)
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.createdAt), "PPpp")}
                    </p>

                    {/* Note */}
                    {displayNote && (
                      <p className="text-xs sm:text-sm mt-1.5 font-medium text-foreground/90 whitespace-pre-wrap bg-muted/30 p-2.5 rounded-xl border">
                        {displayNote}
                      </p>
                    )}

                    {/* Created by */}
                    {item.createdBy && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        by {item.createdBy.email}
                        {item.createdBy.role && ` (${item.createdBy.role})`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
