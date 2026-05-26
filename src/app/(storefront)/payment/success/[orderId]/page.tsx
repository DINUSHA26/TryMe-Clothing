"use client";

/**
 * Payment success page
 * Shows payment confirmation with polling for webhook delays
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Loader2,
  Package,
  Clock,
  AlertCircle,
} from "lucide-react";

interface PaymentSuccessPageProps {
  params: { orderId: string };
}

export default function PaymentSuccessPage({
  params,
}: PaymentSuccessPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 10; // Poll for 30 seconds (10 attempts × 3 seconds)

  // Fetch order details
  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch order");
        setLoading(false);
        return;
      }

      setOrderDetails(result.data.order);
      setLoading(false);
    } catch (err) {
      setError("Failed to load order details");
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [params.orderId]);

  // Polling logic for webhook delay
  useEffect(() => {
    if (!orderDetails) return;

    // If payment confirmed, stop polling
    if (orderDetails.status === "PAYMENT_CONFIRMED") {
      return;
    }

    // If still pending and haven't reached max polls, continue polling
    if (orderDetails.status === "PENDING_PAYMENT" && pollCount < maxPolls) {
      const timer = setTimeout(() => {
        console.log(`Polling order status... (${pollCount + 1}/${maxPolls})`);
        fetchOrder();
        setPollCount((prev) => prev + 1);
      }, 3000); // Poll every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [orderDetails, pollCount]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConfirmed = orderDetails.status === "PAYMENT_CONFIRMED";
  const isPending = orderDetails.status === "PENDING_PAYMENT";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConfirmed && (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Payment Successful!
              </>
            )}
            {isPending && (
              <>
                <Clock className="h-6 w-6 text-amber-600" />
                Processing Payment...
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success/Processing Message */}
          {isConfirmed && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your payment has been confirmed! Your order is being processed.
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <Alert className="border-amber-600 bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Your payment is being processed. This may take a few moments.
                {pollCount < maxPolls && (
                  <span className="ml-2">
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Order Details */}
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              Order Details
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-medium">{orderDetails.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">
                  {orderDetails.items.length} item
                  {orderDetails.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  Rs. {orderDetails.totalAmount.toLocaleString()}
                </span>
              </div>
              {orderDetails.payment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Payment Method:
                    </span>
                    <span className="font-medium">
                      {orderDetails.payment.method || "Card"}
                    </span>
                  </div>
                  {orderDetails.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid At:</span>
                      <span className="font-medium">
                        {new Date(orderDetails.payment.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Items Ordered:</h3>
            <div className="space-y-2">
              {orderDetails.items.map((item: any) => {
                const product = item.productSnapshot;
                const variant = item.variantSnapshot;
                return (
                  <div
                    key={item.id}
                    className="flex justify-between rounded border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {variant && (
                        <div className="text-xs text-muted-foreground">
                          {variant.name}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Shipping Address:</h3>
            <div className="rounded border bg-gray-50 p-3 text-sm">
              <div>{orderDetails.shippingAddress.fullName}</div>
              <div>{orderDetails.shippingAddress.phone}</div>
              <div>{orderDetails.shippingAddress.addressLine1}</div>
              {orderDetails.shippingAddress.addressLine2 && (
                <div>{orderDetails.shippingAddress.addressLine2}</div>
              )}
              <div>
                {orderDetails.shippingAddress.city},{" "}
                {orderDetails.shippingAddress.province}{" "}
                {orderDetails.shippingAddress.postalCode}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isConfirmed && (
              <Button
                onClick={() => router.push(`/orders/${params.orderId}`)}
                className="flex-1"
              >
                View Order Details
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex-1"
            >
              Continue Shopping
            </Button>
          </div>

          {/* Processing Note */}
          {isPending && pollCount >= maxPolls && (
            <Alert>
              <AlertDescription className="text-sm">
                Your payment is still being processed. This can take a few
                minutes. You can check your order status by viewing your orders.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
