/**
 * Individual Item Status Accordion
 * Keeps the order page clean by allowing sellers to expand individual item status
 * updates only when they need to override a specific item separately from the rest of the order.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { UpdateOrderItemStatusForm } from "./UpdateOrderItemStatusForm";
import { OrderStatus } from "@prisma/client";

interface IndividualItemStatusAccordionProps {
  orderItemId: string;
  currentStatus: OrderStatus;
  productName: string;
  isWebsiteOrder?: boolean;
  apiEndpointPrefix?: string;
}

export function IndividualItemStatusAccordion({
  orderItemId,
  currentStatus,
  productName,
  isWebsiteOrder = false,
  apiEndpointPrefix = "/api/vendor/orders/items",
}: IndividualItemStatusAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pt-3 border-t">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>
            {isOpen ? "Hide Individual Item Controls" : "Update this item separately (Override)"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 ml-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          )}
        </Button>

        <span className="text-[11px] text-muted-foreground italic">
          Item Status: <strong className="text-foreground">{currentStatus.replace(/_/g, " ")}</strong>
        </span>
      </div>

      {isOpen && (
        <div className="mt-3 p-4 rounded-xl border bg-muted/20 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Use this section only if this item (<strong>{productName}</strong>) requires a separate status or specific courier tracking code distinct from the entire order.
          </p>
          <UpdateOrderItemStatusForm
            orderItemId={orderItemId}
            currentStatus={currentStatus}
            productName={productName}
            isWebsiteOrder={isWebsiteOrder}
            apiEndpointPrefix={apiEndpointPrefix}
          />
        </div>
      )}
    </div>
  );
}

