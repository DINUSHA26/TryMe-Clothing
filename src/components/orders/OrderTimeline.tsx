"use client";

/**
 * Order Timeline Component
 * Displays order status history with sub-order / package filtering
 * when the order contains items from multiple shops.
 */

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, Store, Layers } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatus, UserRole } from "@prisma/client";

interface StatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  createdBy: {
    email: string;
    role: UserRole | null;
  } | null;
}

interface PackageOption {
  vendorId: string;
  vendorName: string;
}

interface OrderTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: OrderStatus;
  packages?: PackageOption[];
}

export function OrderTimeline({
  statusHistory,
  currentStatus,
  packages = [],
}: OrderTimelineProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>("all");

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
    selectedVendor === "all"
      ? sortedHistory
      : sortedHistory.filter((item) => {
          if (!item.note) return true;
          const targetPkg = packages.find((p) => p.vendorId === selectedVendor);
          if (!targetPkg) return true;
          const vNameLower = targetPkg.vendorName.toLowerCase();
          const noteLower = item.note.toLowerCase();

          // Match store name in note, or general non-vendor events (like bank transfer approval)
          const isOtherVendor = packages
            .filter((p) => p.vendorId !== selectedVendor)
            .some((p) => noteLower.includes(p.vendorName.toLowerCase()));

          if (isOtherVendor && !noteLower.includes(vNameLower)) {
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
              onClick={() => setSelectedVendor("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedVendor === "all"
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
                onClick={() => setSelectedVendor(pkg.vendorId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedVendor === pkg.vendorId
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
          {filteredHistory.map((item, index) => {
            const isFirst = index === 0;
            const isCurrent = item.status === currentStatus;

            // Check if note mentions any of our packages
            const mentionedPackage = packages.find(
              (p) =>
                item.note &&
                item.note.toLowerCase().includes(p.vendorName.toLowerCase())
            );

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
                  {item.note && (
                    <p className="text-xs sm:text-sm mt-1.5 font-medium text-foreground/90 whitespace-pre-wrap bg-muted/30 p-2.5 rounded-xl border">
                      {item.note}
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
          })}
        </div>
      </div>
    </div>
  );
}
