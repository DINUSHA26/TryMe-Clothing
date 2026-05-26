/**
 * Order Timeline Component
 * Displays order status history in a vertical timeline format
 */

import { format } from "date-fns";
import { CheckCircle2, Circle, Clock } from "lucide-react";
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

interface OrderTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: OrderStatus;
}

export function OrderTimeline({ statusHistory, currentStatus }: OrderTimelineProps) {
  if (statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No status history available
      </div>
    );
  }

  // Reverse to show most recent first
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Order Timeline</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline items */}
        <div className="space-y-6">
          {sortedHistory.map((item, index) => {
            const isFirst = index === 0;
            const isCurrent = item.status === currentStatus;

            return (
              <div key={item.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  {isFirst ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <OrderStatusBadge status={item.status} />
                    {isFirst && (
                      <span className="text-xs text-muted-foreground">(Current)</span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(item.createdAt), "PPpp")}
                  </p>

                  {/* Note */}
                  {item.note && (
                    <p className="text-sm mt-2 whitespace-pre-wrap">{item.note}</p>
                  )}

                  {/* Created by */}
                  {item.createdBy && (
                    <p className="text-xs text-muted-foreground mt-1">
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
