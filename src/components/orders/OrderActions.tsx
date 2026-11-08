/**
 * Order Actions Component
 * Renders action buttons based on available actions for the order
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { ConfirmDeliveryDialog } from "./ConfirmDeliveryDialog";
import { RequestReturnDialog } from "./RequestReturnDialog";
import { DisputeForm } from "@/components/disputes/DisputeForm";
import { CompleteOrderDialog } from "./CompleteOrderDialog";
import Link from "next/link";
import { XCircle, CheckCircle, PackageX, AlertTriangle, CreditCard } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  actions: {
    canPay?: boolean;
    canCancel: boolean;
    canConfirmDelivery: boolean;
    canRequestReturn: boolean;
    canOpenDispute: boolean;
    canComplete?: boolean;
    cancelReason?: string;
    returnReason?: string;
  };
  singleVendorId?: string;
  singleVendorName?: string;
  isMultiVendor?: boolean;
  onSuccess?: () => void;
}

export function OrderActions({
  orderId,
  orderNumber,
  actions,
  singleVendorId,
  singleVendorName,
  isMultiVendor = false,
  onSuccess,
}: OrderActionsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDeliveryDialogOpen, setConfirmDeliveryDialogOpen] =
    useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // If no actions available and not multi-vendor prompt, don't render anything
  if (
    !actions.canPay &&
    !actions.canCancel &&
    !actions.canConfirmDelivery &&
    !actions.canComplete
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Complete Payment / Pay Now */}
      {actions.canPay && (
        <Link href={`/payment/${orderId}`}>
          <Button className="bg-[#FF6600] hover:bg-[#e65c00] text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Complete Payment
          </Button>
        </Link>
      )}

      {/* Cancel Order */}
      {actions.canCancel && (
        <>
          <Button
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>
          <CancelOrderDialog
            orderId={orderId}
            orderNumber={orderNumber}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Confirm Delivery - only rendered at top level if single-vendor; multi-vendor packages have their own confirm button */}
      {actions.canConfirmDelivery && !isMultiVendor && (
        <>
          <Button
            variant="default"
            onClick={() => setConfirmDeliveryDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Delivery
          </Button>
          <ConfirmDeliveryDialog
            orderId={orderId}
            orderNumber={orderNumber}
            vendorId={singleVendorId}
            vendorName={singleVendorName}
            open={confirmDeliveryDialogOpen}
            onOpenChange={setConfirmDeliveryDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Complete Order */}
      {actions.canComplete && (
        <>
          <Button
            variant="default"
            onClick={() => setCompleteDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white border-none"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Order
          </Button>
          <CompleteOrderDialog
            orderId={orderId}
            orderNumber={orderNumber}
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}


      {/* Disabled action messages */}
      {!actions.canCancel && actions.cancelReason && (
        <p className="text-sm text-muted-foreground w-full">
          Cannot cancel: {actions.cancelReason}
        </p>
      )}
    </div>
  );
}
