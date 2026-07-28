/**
 * Order Card Component
 * Displays order summary in list view with key details and actions
 */

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@prisma/client";
import { ChevronRight, Package, CreditCard } from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    itemCount: number;
    itemImages: (string | null)[];
    previewItems?: { status: OrderStatus }[];
  };
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card relative">
      <Link
        href={`/orders/${order.id}`}
        className="flex items-start gap-4"
      >
        {/* Product Images Preview */}
        <div className="flex-shrink-0">
          {order.itemImages.length > 0 ? (
            <div className="flex gap-1">
              {order.itemImages.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 rounded border overflow-hidden bg-muted"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={`Product ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {order.itemImages.length > 3 && (
                <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{order.itemImages.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
               <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 min-w-0">
          {/* Order Number & Status */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
            <OrderStatusBadge status={order.status} items={order.previewItems} />
          </div>

          {/* Date & Item Count */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
            <span>{format(new Date(order.createdAt), "PPP")}</span>
            <span>
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Total Amount & Action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-lg">
              Rs.{" "}
              {order.totalAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            {order.status === "PENDING_PAYMENT" && (
              <Link
                href={`/payment/${order.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-[#FF6600] hover:bg-[#e65c00] px-4 py-2 rounded-lg transition-colors z-10"
              >
                <CreditCard className="w-4 h-4" />
                Complete Payment
              </Link>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0 self-center">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Link>
    </div>
  );
}
