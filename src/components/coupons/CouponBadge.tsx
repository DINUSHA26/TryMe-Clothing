/**
 * Coupon status and channel badge component
 */

import { CouponType, CouponApplicableTo } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign, Globe, Store, ShoppingBag } from "lucide-react";

interface CouponBadgeProps {
  type?: CouponType;
  isActive?: boolean;
  applicableTo?: CouponApplicableTo;
  variant?: "type" | "status" | "channel";
}

export function CouponBadge({
  type,
  isActive,
  applicableTo,
  variant = "type",
}: CouponBadgeProps) {
  if (variant === "status") {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  }

  if (variant === "channel") {
    if (applicableTo === CouponApplicableTo.OWN_WEBSITE) {
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold"
        >
          <Store className="h-3 w-3" />
          Own Website Only
        </Badge>
      );
    }
    if (applicableTo === CouponApplicableTo.TRYME) {
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
        >
          <ShoppingBag className="h-3 w-3" />
          TryMe.lk Only
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 font-semibold"
      >
        <Globe className="h-3 w-3" />
        TryMe &amp; Website
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
