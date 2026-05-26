/**
 * Coupon card component for displaying coupon details
 */

"use client";

import { Coupon, CouponType } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CouponBadge } from "./CouponBadge";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Calendar,
  Copy,
  Edit,
  MoreVertical,
  Trash2,
  Users,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface CouponCardProps {
  coupon: Coupon & {
    _count?: {
      orders: number;
      usages: number;
    };
    vendor?: {
      businessName: string;
      slug: string;
    } | null;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  showVendor?: boolean;
}

export function CouponCard({
  coupon,
  onEdit,
  onDelete,
  showVendor = false,
}: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText =
    coupon.type === CouponType.PERCENTAGE
      ? `${coupon.value}% OFF`
      : `${formatCurrency(Number(coupon.value))} OFF`;

  const isExpired = coupon.validUntil && new Date() > new Date(coupon.validUntil);
  const isNotYetValid = new Date() < new Date(coupon.validFrom);

  return (
    <Card className={!coupon.isActive || isExpired ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <code className="text-xl font-bold text-primary px-3 py-1 bg-primary/10 rounded">
                {coupon.code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-2xl font-bold text-green-600">{discountText}</p>
          </div>
          <div className="flex items-center gap-2">
            <CouponBadge type={coupon.type} />
            <CouponBadge
              type={coupon.type}
              isActive={coupon.isActive && !isExpired}
              variant="status"
            />
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {showVendor && coupon.vendor && (
          <div className="mb-4 p-2 bg-muted rounded text-sm">
            <span className="text-muted-foreground">Vendor:</span>{" "}
            <span className="font-medium">{coupon.vendor.businessName}</span>
          </div>
        )}

        {showVendor && !coupon.vendor && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm text-blue-600 dark:text-blue-400 font-medium">
            Platform-wide Coupon
          </div>
        )}

        <div className="space-y-2 text-sm">
          {coupon.minOrderAmount && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              <span>
                Min. order: {formatCurrency(Number(coupon.minOrderAmount))}
              </span>
            </div>
          )}

          {coupon.maxDiscount && coupon.type === CouponType.PERCENTAGE && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Max. discount: {formatCurrency(Number(coupon.maxDiscount))}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Valid: {format(new Date(coupon.validFrom), "MMM dd, yyyy")}
              {coupon.validUntil &&
                ` - ${format(new Date(coupon.validUntil), "MMM dd, yyyy")}`}
            </span>
          </div>

          {isNotYetValid && (
            <p className="text-amber-600 text-xs">Not yet valid</p>
          )}

          {isExpired && <p className="text-destructive text-xs">Expired</p>}

          {coupon.usageLimit && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Usage: {coupon.usageCount} / {coupon.usageLimit}
              </span>
            </div>
          )}

          {!coupon.usageLimit && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Usage: {coupon.usageCount} (Unlimited)</span>
            </div>
          )}

          <div className="text-muted-foreground">
            Per user limit: {coupon.perUserLimit}
          </div>
        </div>
      </CardContent>

      {coupon._count && (
        <CardFooter className="p-4 pt-0 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span>{coupon._count.orders} orders</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{coupon._count.usages} customers</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
