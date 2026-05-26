/**
 * Order Status Badge Component
 * Displays order status with appropriate color coding
 */

import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  items?: any[];
  className?: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    variant: "outline",
    className: "border-yellow-500 text-yellow-700 bg-yellow-50",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    variant: "outline",
    className: "border-orange-500 text-orange-700 bg-orange-50",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment Confirmed",
    variant: "default",
    className: "bg-blue-500 text-white",
  },
  PROCESSING: {
    label: "Processing",
    variant: "default",
    className: "bg-purple-500 text-white",
  },
  SHIPPED: {
    label: "Shipped",
    variant: "default",
    className: "bg-indigo-500 text-white",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "default",
    className: "bg-teal-500 text-white",
  },
  DELIVERY_CONFIRMED: {
    label: "Delivery Confirmed",
    variant: "default",
    className: "bg-green-600 text-white",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    variant: "outline",
    className: "border-orange-500 text-orange-700 bg-orange-50",
  },
  RETURNED: {
    label: "Returned",
    variant: "secondary",
  },
  DISPUTED: {
    label: "Disputed",
    variant: "destructive",
    className: "bg-red-600 text-white",
  },
  REFUNDED: {
    label: "Refunded",
    variant: "destructive",
  },
  COMPLETED: {
    label: "Completed",
    variant: "default",
    className: "bg-emerald-600 text-white",
  },
  PARTIALLY_SHIPPED: {
    label: "Partially Shipped",
    variant: "default",
    className: "bg-blue-400 text-white",
  },
};

export function OrderStatusBadge({ status, items, className }: OrderStatusBadgeProps) {
  // Logic for complex status display (e.g. Disputed & Return Requested)
  if (items && items.length > 0) {
    const hasDispute = items.some(item => item.status === 'DISPUTED');
    const hasReturn = items.some(item => item.status === 'RETURN_REQUESTED');

    if (hasDispute && hasReturn) {
      return (
        <Badge
          variant="destructive"
          className={`bg-gradient-to-r from-red-600 to-orange-500 text-white border-none ${className || ""}`}
        >
          Disputed & Returns
        </Badge>
      );
    }
  }

  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className || ""} ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}
