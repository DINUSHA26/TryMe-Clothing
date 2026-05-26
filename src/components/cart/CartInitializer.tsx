"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

/**
 * CartInitializer
 * Captures promotion codes from URL parameters and stores them for auto-application.
 */
function CartInitializerContent() {
  const searchParams = useSearchParams();
  const { promoCode, setPromoCode } = useCartStore();

  useEffect(() => {
    const promo = searchParams.get("promo");
    if (promo && promo !== promoCode) {
      console.log(`[Promo] Captured deal code: ${promo}`);
      setPromoCode(promo);
      toast.success(`Deal captured: ${promo}`, {
        description: "We'll apply this discount automatically once you reach the minimum order value at checkout.",
      });
    }
  }, [searchParams, promoCode, setPromoCode]);

  return null;
}

export function CartInitializer() {
  return (
    <Suspense fallback={null}>
      <CartInitializerContent />
    </Suspense>
  );
}
