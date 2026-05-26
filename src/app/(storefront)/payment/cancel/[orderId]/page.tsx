"use client";

/**
 * Payment cancel page
 * Shown when user cancels payment on PayHere
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, Loader2, AlertCircle } from "lucide-react";

interface PaymentCancelPageProps {
  params: { orderId: string };
}

export default function PaymentCancelPage({
  params,
}: PaymentCancelPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
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
    }

    fetchOrder();
  }, [params.orderId]);

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

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <XCircle className="h-6 w-6" />
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cancellation Message */}
          <Alert className="border-amber-600 bg-amber-50">
            <XCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You cancelled the payment. Your order is still pending and can be
              paid at any time.
            </AlertDescription>
          </Alert>

          {/* Order Details */}
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <div className="text-sm font-medium">Order Details</div>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-amber-600">
                  Pending Payment
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <Alert>
            <AlertDescription className="text-sm">
              Your order has been saved and is waiting for payment. You can
              retry the payment now or come back later to complete it.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/payment/${params.orderId}`)}
              className="flex-1"
            >
              Try Payment Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/cart")}
              className="flex-1"
            >
              Return to Cart
            </Button>
          </div>

          {/* Additional Options */}
          <div className="flex justify-center">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm"
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
