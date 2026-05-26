/**
 * Coupon input component for applying discount codes
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { CouponValidation } from "@/types/coupon";
import { useCartStore } from "@/stores/cartStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tag, X, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CouponInputProps {
  subtotal: number;
  cartItems: {
    productId: string;
    vendorId: string;
    quantity: number;
    price: number;
  }[];
  onApply: (validation: CouponValidation | null) => void;
}

export function CouponInput({
  subtotal,
  cartItems,
  onApply,
}: CouponInputProps) {
  const { promoCode, clearPromoCode } = useCartStore();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isAutoApplied, setIsAutoApplied] = useState(false);
  const [pendingReason, setPendingReason] = useState<string | null>(null);
  const [lastValidatedKey, setLastValidatedKey] = useState<string>("");

  const validateAndApply = useCallback(async (couponCode: string, isAuto: boolean = false) => {
    if (!couponCode.trim()) {
      if (!isAuto) setError("Please enter a coupon code");
      return;
    }

    const currentKey = `${couponCode}-${subtotal}-${cartItems.map(i => i.productId).join(",")}`;
    if (isAuto && currentKey === lastValidatedKey) {
      return; // Already tried this exact combination
    }

    setIsValidating(true);
    setError(null);
    if (isAuto) setPendingReason(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: couponCode.toUpperCase().trim(),
          subtotal,
          cartItems,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (!isAuto) {
          setError(result.error || "Failed to validate coupon");
        } else {
          console.log(`[Promo] Auto-apply failed: ${result.error}`);
          setPendingReason(result.error || "Validation failed");
        }
        if (isAuto) setLastValidatedKey(currentKey);
        return;
      }

      if (!result.data.isValid) {
        if (!isAuto) {
          setError(result.data.error || "Invalid coupon code");
        } else {
          setPendingReason(result.data.error || "Requirements not met");
        }
        if (isAuto) setLastValidatedKey(currentKey);
        return;
      }

      // Coupon is valid
      setAppliedCoupon(result.data);
      onApply(result.data);
      setIsAutoApplied(isAuto);
      if (isAuto) {
        toast.success("Coupon auto-applied!", {
          description: `The deal code ${couponCode} has been applied to your order.`,
          icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
        });
      }
      setCode("");
      if (isAuto) setLastValidatedKey(currentKey);
    } catch (error) {
      console.error("Error validating coupon:", error);
      if (!isAuto) setError("Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  }, [subtotal, cartItems, onApply, lastValidatedKey]);

  // Handle auto-apply when subtotal or promoCode changes
  useEffect(() => {
    const currentKey = `${promoCode}-${subtotal}-${cartItems.map(i => i.productId).join(",")}`;
    if (promoCode && !appliedCoupon && !isValidating && !error && currentKey !== lastValidatedKey) {
      validateAndApply(promoCode, true);
    }
  }, [promoCode, appliedCoupon, isValidating, error, validateAndApply, subtotal, cartItems, lastValidatedKey]);

  const handleApply = () => validateAndApply(code);

  const handleRemove = () => {
    setAppliedCoupon(null);
    onApply(null);
    setCode("");
    setError(null);
    setIsAutoApplied(false);
    // Also clear from store so it doesn't re-apply automatically
    if (isAutoApplied) {
      clearPromoCode();
    }
  };

  return (
    <div className="space-y-4">
      {/* Applied coupon display */}
      {appliedCoupon && appliedCoupon.isValid && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-900">
                {isAutoApplied ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                    Deal Applied: {appliedCoupon.coupon?.code}
                  </span>
                ) : (
                  `Coupon Applied: ${appliedCoupon.coupon?.code}`
                )}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-900">
                -Rs. {appliedCoupon.discount?.amount.toFixed(2)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-auto p-1 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending auto-promo message */}
      {!appliedCoupon && promoCode && !isValidating && (
        <Alert className="bg-blue-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            You have a pending deal <strong>{promoCode}</strong>. 
            {pendingReason ? (
              <span className="block mt-1 text-blue-700 font-medium">
                Condition: {pendingReason}
              </span>
            ) : (
              " It will be applied automatically once your order meets the requirements."
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Input field (hidden when coupon is applied) */}
      {!appliedCoupon && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApply();
                  }
                }}
                className="pl-10"
                disabled={isValidating}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? "Validating..." : "Apply"}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
