"use client";

/**
 * Order Item Card Component
 * Displays individual order item with product details, variant, and pricing
 */

import Image from "next/image";
import Link from "next/link";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatus, RefundStatus } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageX, AlertTriangle, AlertCircle } from "lucide-react";
import { RequestReturnDialog } from "./RequestReturnDialog";
import { DisputeForm } from "@/components/disputes/DisputeForm";
import { calculateItemActions } from "@/lib/utils/order";
import { Badge } from "@/components/ui/badge";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";

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

interface OrderItemCardProps {
  id: string;
  productSnapshot: ProductSnapshot;
  variantSnapshot?: VariantSnapshot | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  discountedTotalPrice?: number;
  status?: OrderStatus;
  showStatus?: boolean;
  refundStatus?: RefundStatus;
  disputeId?: string | null;
  isReturnable?: boolean;
  orderId: string;
  orderNumber: string;
  deliveryConfirmedAt?: string | Date | null;
  onSuccess?: () => void;
  orderStatus?: OrderStatus;
  isCustomer?: boolean;
  review?: { id: string; rating: number; comment: string | null } | null;
}

export function OrderItemCard({
  id,
  productSnapshot,
  variantSnapshot,
  quantity,
  unitPrice,
  totalPrice,
  discountAmount = 0,
  discountedTotalPrice,
  status,
  showStatus = false,
  refundStatus = "NONE",
  disputeId = null,
  isReturnable = true,
  orderId,
  orderNumber,
  deliveryConfirmedAt,
  onSuccess,
  orderStatus,
  isCustomer = false,
  review = null,
}: OrderItemCardProps) {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);

  const actions = calculateItemActions({
    status: status || "PENDING_PAYMENT",
    deliveryConfirmedAt: deliveryConfirmedAt ? new Date(deliveryConfirmedAt) : null,
    refundStatus,
    disputeId,
    isReturnable,
    orderStatus,
    hasReview: !!review,
  });

  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card">
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
        {productSnapshot.image ? (
          <Image
            src={productSnapshot.image}
            alt={productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${productSnapshot.slug}`}
          className="font-medium hover:underline line-clamp-1"
        >
          {productSnapshot.name}
        </Link>

        {/* Variant */}
        {variantSnapshot && (
          <p className="text-sm text-muted-foreground mt-1">
            {variantSnapshot.name}: {variantSnapshot.value}
          </p>
        )}

        {/* Vendor */}
        <p className="text-sm text-muted-foreground mt-1">
          Sold by: {productSnapshot.vendorName}
        </p>

        {/* Quantity & Price */}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-muted-foreground">
            Qty: {quantity}
          </span>
          <span className="text-sm text-muted-foreground">×</span>
          <span className="text-sm">
            Rs. {unitPrice.toLocaleString("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Status Badge */}
        {showStatus && status && (
          <div className="mt-2">
            <OrderStatusBadge status={status} />
          </div>
        )}
      </div>

      {/* Total Price & Actions */}
      <div className="flex-shrink-0 text-right min-w-[120px]">
        {discountAmount > 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground line-through">
              Rs. {totalPrice.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="font-bold text-green-600">
              Rs. {(discountedTotalPrice ?? (totalPrice - discountAmount)).toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] h-5 px-1.5">
              -Rs. {discountAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Badge>
          </div>
        ) : (
          <p className="font-semibold">
            Rs. {totalPrice.toLocaleString("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}

        {/* Item Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isCustomer === true && actions.canRequestReturn && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnDialogOpen(true)}
              >
                <PackageX className="w-3 h-3 mr-1" />
                Return
              </Button>
              <RequestReturnDialog
                orderId={orderId}
                orderNumber={orderNumber}
                open={returnDialogOpen}
                onOpenChange={setReturnDialogOpen}
                onSuccess={onSuccess}
                orderItemId={id}
              />
            </>
          )}

          {isCustomer === true && actions.canOpenDispute && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={() => setDisputeDialogOpen(true)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Dispute (Customer Only)
              </Button>
              <DisputeForm
                orderId={orderId}
                orderNumber={orderNumber}
                open={disputeDialogOpen}
                onOpenChange={setDisputeDialogOpen}
                orderItemId={id}
              />
            </>
          )}

          {/* Refund Status Badge */}
          {refundStatus !== "NONE" && (
            <Badge variant={refundStatus === "COMPLETED" ? "default" : "secondary"}>
              Refund: {refundStatus}
            </Badge>
          )}

          {/* Dispute Badge */}
          {disputeId && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Disputed
            </Badge>
          )}

          {/* Rate & Review Button */}
          {isCustomer && actions.canReview && (
            <div className="w-full mt-2 flex justify-end">
              <WriteReviewButton
                orderItemId={id}
                productName={productSnapshot.name}
                existingReview={review}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
