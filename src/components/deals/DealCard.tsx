"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Check, ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface Deal {
  id: string;
  code: string;
  type: "FLAT" | "PERCENTAGE";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validUntil: string | null;
  isExpiringSoon: boolean;
  vendor: {
    businessName: string;
    slug: string;
    logo: string | null;
  } | null;
}

interface DealCardProps {
  deal: Deal;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DealCard({ deal }: DealCardProps) {
  const [copied, setCopied] = useState(false);

  const discountLabel =
    deal.type === "PERCENTAGE"
      ? `${deal.value}% OFF`
      : `Rs. ${formatCurrency(deal.value)} OFF`;

  const remainingUses =
    deal.usageLimit !== null ? deal.usageLimit - deal.usageCount : null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(deal.code);
      setCopied(true);
      toast.success(`Code "${deal.code}" copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — please copy the code manually.");
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {deal.isExpiringSoon && (
        <Badge className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] z-10">
          Expiring Soon
        </Badge>
      )}

      <CardContent className="p-6 flex-1">
        {/* Discount hero */}
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-green-600">{discountLabel}</p>
          {deal.maxDiscount && deal.type === "PERCENTAGE" && (
            <p className="text-xs text-muted-foreground mt-1">
              Up to Rs. {formatCurrency(deal.maxDiscount)}
            </p>
          )}
        </div>

        {/* Coupon code */}
        <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 bg-muted rounded-lg border-2 border-dashed border-primary/40">
          <code className="text-base font-bold tracking-widest text-primary">
            {deal.code}
          </code>
          <button
            onClick={copyCode}
            className="ml-1 p-1 rounded hover:bg-primary/10 transition-colors"
            aria-label="Copy coupon code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Scope badge */}
        <div className="flex justify-center mb-3">
          {deal.vendor ? (
            <Link
              href={`/vendors/${deal.vendor.slug}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Store className="h-3 w-3" />
              {deal.vendor.businessName}
            </Link>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Platform Deal
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-center">
          {deal.minOrderAmount !== null && (
            <p className="text-xs text-muted-foreground">
              Min. order: Rs. {formatCurrency(deal.minOrderAmount)}
            </p>
          )}
          {deal.validUntil && (
            <p className="text-xs text-muted-foreground">
              Expires: {formatDate(deal.validUntil)}
            </p>
          )}
          {remainingUses !== null && (
            <p className="text-xs text-muted-foreground">
              {remainingUses} use{remainingUses !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <Button className="w-full" asChild>
          <Link
            href={
              deal.vendor 
                ? `/vendors/${deal.vendor.slug}?promo=${deal.code}` 
                : `/products?promo=${deal.code}`
            }
          >
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
