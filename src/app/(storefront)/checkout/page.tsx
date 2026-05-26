/**
 * Checkout page with multi-step flow
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { Address } from "@/types/address";
import { CouponValidation } from "@/types/coupon";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { AddressForm } from "@/components/checkout/AddressForm";
import { CouponInput } from "@/components/checkout/CouponInput";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { OrderReview } from "@/components/checkout/OrderReview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Tag,
  FileText,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const cartStore = useCartStore();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const initializeCheckout = async () => {
      setIsLoading(true);

      try {
        // Fetch cart
        await cartStore.fetchCart();

        // Check if cart is empty
        if (cartStore.items.length === 0) {
          toast({
            variant: "destructive",
            title: "Cart is empty",
            description: "Add items to your cart before checking out",
          });
          router.push("/cart");
          return;
        }

        // Fetch addresses
        const addressResponse = await fetch("/api/addresses", {
          credentials: "include",
        });
        const addressResult = await addressResponse.json();

        if (addressResult.success && addressResult.data) {
          setAddresses(addressResult.data.addresses);
          // Auto-select default address
          if (addressResult.data.defaultAddress) {
            setSelectedAddressId(addressResult.data.defaultAddress.id);
          }
        }

        // Run checkout validation
        const validationResponse = await fetch("/api/checkout/validate", {
          method: "POST",
          credentials: "include",
        });
        const validationResult = await validationResponse.json();

        if (
          validationResult.success &&
          validationResult.data &&
          !validationResult.data.isValid
        ) {
          // Only treat cart and stock errors as fatal (blocking the page)
          // Missing address error should not block current page load, it will be handled by Step 1
          const fatalErrors = validationResult.data.errors
            .filter((e: any) => e.type !== "address")
            .map((e: any) => e.message);

          if (fatalErrors.length > 0) {
            setValidationErrors(fatalErrors);
          }
        }
      } catch (error) {
        console.error("Error initializing checkout:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load checkout. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, []);

  // Calculate totals
  const subtotal = Number(
    cartStore.items
      .reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)
      .toFixed(2)
  );
  const discount = appliedCoupon?.discount?.amount || 0;
  const shippingAmount = 0; // Free shipping for now
  const total = Number((subtotal - discount + shippingAmount).toFixed(2));

  // Handle address operations
  const handleAddressCreated = (newAddress: Address) => {
    setAddresses([...addresses, newAddress]);
    setSelectedAddressId(newAddress.id);
    setShowAddressForm(false);
  };

  const handleAddressUpdated = (updatedAddress: Address) => {
    setAddresses(
      addresses.map((a) => (a.id === updatedAddress.id ? updatedAddress : a))
    );
    setEditingAddress(null);
  };

  const handleAddressDeleted = async (addressId: string) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          description: result.error || "Failed to delete address",
        });
        return;
      }

      setAddresses(addresses.filter((a) => a.id !== addressId));
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
      }

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete address",
      });
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({
        variant: "destructive",
        description: "Please select a shipping address",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          shippingAddressId: selectedAddressId,
          couponCode: appliedCoupon?.coupon?.code || null,
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: result.error || "Failed to create order",
        });
        setIsSubmitting(false);
        return;
      }

      // Clear cart in store (backend already cleared it)
      cartStore.clearCart();

      toast({
        title: "Order Placed!",
        description: `Order ${result.data.orderNumber} created successfully`,
      });

      // Redirect to payment page (Phase 9)
      router.push(`/payment/${result.data.orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Render validation errors
  if (validationErrors.length > 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">
              Please fix the following issues before proceeding:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button onClick={() => router.push("/cart")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Shipping Address", icon: MapPin },
    { number: 2, title: "Coupon (Optional)", icon: Tag },
    { number: 3, title: "Review Order", icon: FileText },
    { number: 4, title: "Payment", icon: CreditCard },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">
          Complete your order in a few simple steps
        </p>
      </div>

      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground/30 text-muted-foreground"
                    }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-2 text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${currentStep > step.number
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-8">
        {/* Left column - Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping Address */}
          {currentStep === 1 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <AddressSelector
                addresses={addresses}
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAddNew={() => setShowAddressForm(true)}
                onEdit={(address) => setEditingAddress(address)}
                onDelete={handleAddressDeleted}
              />
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedAddressId}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Coupon */}
          {currentStep === 2 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Apply Coupon</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Have a discount code? Apply it here to reduce your order total.
              </p>
              <CouponInput
                subtotal={subtotal}
                cartItems={cartStore.items.map((item) => ({
                  productId: item.productId,
                  vendorId: item.vendorId,
                  quantity: item.quantity,
                  price: item.finalPrice,
                }))}
                onApply={setAppliedCoupon}
              />
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Review Order */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
                <OrderReview items={cartStore.items} />
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Order Notes (Optional)
                </h2>
                <Textarea
                  placeholder="Add any special instructions for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {notes.length}/500 characters
                </p>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Summary (sticky) */}
        <div className="lg:col-span-1">
          <CheckoutSummary
            itemCount={cartStore.items.reduce((sum, item) => sum + item.quantity, 0)}
            subtotal={subtotal}
            discount={discount}
            shippingAmount={shippingAmount}
            total={total}
          />
        </div>
      </div>

      {/* Address Form Dialog */}
      <AddressForm
        open={showAddressForm || !!editingAddress}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddressForm(false);
            setEditingAddress(null);
          }
        }}
        onSuccess={editingAddress ? handleAddressUpdated : handleAddressCreated}
        initialData={editingAddress}
        mode={editingAddress ? "edit" : "create"}
      />
    </div>
  );
}
