"use client";

/**
 * Vendor Order Group (Sub-Order / Package) Component
 * Groups order items by vendor, displays sub-order tracking info,
 * and allows package-level delivery confirmation and reviews.
 */

import { useState } from "react";
import { OrderItemCard } from "./OrderItemCard";
import { OrderStatus, RefundStatus } from "@prisma/client";
import { Package, Truck, ExternalLink, CheckCircle, CheckCircle2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageVendorButton } from "@/components/chat/MessageVendorButton";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ConfirmDeliveryDialog } from "./ConfirmDeliveryDialog";

interface ProductSnapshot {
  productId: string;
  name: string;
  slug: string;
  image: string;
  basePrice: number;
  vendorId: string;
  vendorName: string;
}

interface VariantSnapshot {
  variantId: string;
  name: string;
  value: string;
  priceAdjustment: number;
}

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
}

interface OrderItem {
  id: string;
  productSnapshot: ProductSnapshot;
  variantSnapshot?: VariantSnapshot | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  discountedTotalPrice?: number;
  status: OrderStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  chatRoomId?: string | null;
  review?: ExistingReview | null;
  refundStatus: RefundStatus;
  disputeId?: string | null;
  isReturnable: boolean;
}

interface VendorOrderGroupProps {
  vendorId?: string;
  vendorName: string;
  items: OrderItem[];
  chatRoomId?: string | null;
  orderStatus?: OrderStatus;
  orderId: string;
  orderNumber: string;
  deliveryConfirmedAt?: string | Date | null;
  onSuccess?: () => void;
  isCustomer?: boolean;
  vendorStatus?: OrderStatus;
  packageIndex?: number;
  totalPackages?: number;
}

export function VendorOrderGroup({
  vendorId,
  vendorName,
  items,
  chatRoomId,
  orderStatus,
  orderId,
  orderNumber,
  deliveryConfirmedAt,
  onSuccess,
  isCustomer = false,
  vendorStatus,
  packageIndex,
  totalPackages,
}: VendorOrderGroupProps) {
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);

  // Resolved vendor id from items if not directly passed
  const resolvedVendorId = vendorId || items[0]?.productSnapshot?.vendorId;

  // Check if any item has tracking info
  const trackingItem = items.find((item) => item.trackingNumber);

  // Non-cancelled items in this package
  const nonCancelledItems = items.filter((item) => item.status !== "CANCELLED");

  // Determine if this specific package is fully delivered
  const isPackageDelivered =
    nonCancelledItems.length > 0 &&
    nonCancelledItems.every((item) =>
      ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(item.status)
    );

  // Determine if this package has been shipped
  const isPackageShipped = nonCancelledItems.some((item) =>
    ["SHIPPED", "PARTIALLY_SHIPPED"].includes(item.status)
  );

  // Customer can confirm delivery ONLY if package is shipped and not yet delivered
  const canConfirmPackage = isCustomer && isPackageShipped && !isPackageDelivered;

  // Show reviews if package is delivered OR whole order is delivered
  const showReviews =
    isCustomer &&
    (isPackageDelivered ||
      ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(orderStatus || ""));

  // Package subtotal calculation
  const packageSubtotal = items.reduce(
    (sum, item) => sum + (item.discountedTotalPrice ?? item.totalPrice),
    0
  );

  return (
    <div className="border-2 rounded-2xl overflow-hidden bg-card shadow-xs transition-all">
      {/* Sub-Order / Package Header */}
      <div className="bg-muted/70 px-4 sm:px-5 py-3.5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <Store className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {totalPackages && totalPackages > 1
                    ? `Package ${packageIndex ? `#${packageIndex}` : ""} • Sold by:`
                    : "Sold by:"}
                </span>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  {vendorName}
                </h3>
                {vendorStatus && (
                  <OrderStatusBadge status={vendorStatus} items={items} />
                )}
                {isPackageDelivered && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Package Subtotal:{" "}
                <strong className="text-foreground">
                  Rs.{" "}
                  {packageSubtotal.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>{" "}
                ({items.length} {items.length === 1 ? "item" : "items"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:self-center">
            {/* Tracking Info if available */}
            {trackingItem && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background border text-xs font-medium">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-bold text-foreground">{trackingItem.trackingNumber}</span>
                {trackingItem.trackingUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-0 ml-1 text-primary hover:underline"
                  >
                    <a
                      href={trackingItem.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Chat with Vendor */}
            <MessageVendorButton
              orderItemId={items[0].id}
              vendorName={vendorName}
              orderNumber={orderNumber}
              items={items.map((item) => item.productSnapshot.name)}
            />

            {/* Confirm Delivery Button for this specific vendor's package */}
            {canConfirmPackage && (
              <Button
                size="sm"
                onClick={() => setConfirmDeliveryOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Confirm {vendorName} Delivery
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Package Items */}
      <div className="p-4 sm:p-5 space-y-4">
        {items.map((item) => (
          <div key={item.id}>
            <OrderItemCard
              id={item.id}
              productSnapshot={item.productSnapshot}
              variantSnapshot={item.variantSnapshot}
              quantity={item.quantity}
              unitPrice={item.unitPrice}
              totalPrice={item.totalPrice}
              discountAmount={item.discountAmount}
              discountedTotalPrice={item.discountedTotalPrice}
              status={item.status}
              showStatus={items.length > 1}
              refundStatus={item.refundStatus}
              disputeId={item.disputeId}
              isReturnable={item.isReturnable}
              orderId={orderId}
              orderNumber={orderNumber}
              deliveryConfirmedAt={deliveryConfirmedAt}
              onSuccess={onSuccess}
              orderStatus={orderStatus}
              isCustomer={isCustomer}
              review={item.review}
            />
          </div>
        ))}
      </div>

      {/* Confirm Delivery Dialog for this specific package */}
      {resolvedVendorId && (
        <ConfirmDeliveryDialog
          orderId={orderId}
          orderNumber={orderNumber}
          vendorId={resolvedVendorId}
          vendorName={vendorName}
          open={confirmDeliveryOpen}
          onOpenChange={setConfirmDeliveryOpen}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
