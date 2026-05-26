/**
 * Coupon status badge component
 */

import { CouponType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign } from "lucide-react";

interface CouponBadgeProps {
  type: CouponType;
  isActive?: boolean;
  variant?: "type" | "status";
}

export function CouponBadge({
  type,
  isActive,
  variant = "type",
}: CouponBadgeProps) {
  if (variant === "status") {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  }

  if (type === CouponType.PERCENTAGE) {
    return (
      <Badge variant="default" className="gap-1">
        <Percent className="h-3 w-3" />
        Percentage
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <DollarSign className="h-3 w-3" />
      Flat
    </Badge>
  );
}
