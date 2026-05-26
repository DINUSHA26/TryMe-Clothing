/**
 * Vendor Order Group Component
 * Groups order items by vendor and displays tracking information
 */

import { OrderItemCard } from "./OrderItemCard";
import { OrderStatus, RefundStatus } from "@prisma/client";
import { Package, Truck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageVendorButton } from "@/components/chat/MessageVendorButton";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import { OrderStatusBadge } from "./OrderStatusBadge";

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
}

export function VendorOrderGroup({
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
}: VendorOrderGroupProps) {
  // Check if any item has tracking info
  const trackingItem = items.find((item) => item.trackingNumber);

  // Show review buttons only after delivery is confirmed or marked as delivered
  const showReviews = isCustomer && ["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(orderStatus || "");

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Vendor Header */}
      <div className="bg-muted px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Sold by: {vendorName}</h3>
            {vendorStatus && (
              <OrderStatusBadge status={vendorStatus} items={items} />
            )}
          </div>
          <div className="flex items-center gap-3">
            {trackingItem && (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Tracking: {trackingItem.trackingNumber}
                </span>
                {trackingItem.trackingUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-0"
                  >
                    <a
                      href={trackingItem.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
            <MessageVendorButton 
              orderItemId={items[0].id} 
              vendorName={vendorName} 
              orderNumber={orderNumber}
              items={items.map(item => item.productSnapshot.name)}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-4">
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
    </div>
  );
}
