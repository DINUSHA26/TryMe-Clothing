/**
 * Admin Order Details Page
 * Complete order information with override capabilities
 */

"use client";

import { use, useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { VendorOrderGroup } from "@/components/orders/VendorOrderGroup";
import { OverrideStatusDialog } from "@/components/admin/orders/OverrideStatusDialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  Shield,
  User,
  Wallet,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface AdminOrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default function AdminOrderDetailsPage({
  params,
}: AdminOrderDetailsPageProps) {
  const { orderId } = use(params);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);

  const handleMarkDelivered = async () => {
    if (!orderData) return;
    setIsMarkingDelivered(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderData.order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          reason: "Admin confirmed package delivery",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrderDetails();
      }
    } catch (err) {
      console.error("Failed to mark as delivered:", err);
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  const handleVerifyPayment = async (action: "APPROVE" | "REJECT") => {
    if (!orderData) return;
    
    let reason = "";
    if (action === "REJECT") {
      const input = prompt("Enter reason for rejection (optional):");
      if (input === null) return; // User cancelled
      reason = input;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderData.order.id}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrderDetails();
      } else {
        alert(data.error || "Failed to verify payment");
      }
    } catch (err) {
      console.error("Failed to verify payment:", err);
      alert("An error occurred");
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/admin/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { order } = orderData;
  const statusHistory = order.statusHistory;
  const itemsByVendor = order.itemsByVendor;

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link href="/admin/orders">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </Link>

      {/* Order Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.createdAt), "PPP 'at' p")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} items={order.items} />
            {order.status === "SHIPPED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkDelivered}
                disabled={isMarkingDelivered}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Truck className="w-4 h-4 mr-2" />
                {isMarkingDelivered ? "Marking..." : "Mark as Delivered"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideDialogOpen(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Override Status
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
            <p className="text-xl font-semibold">
              Rs.{" "}
              {order.subtotal.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Discount</p>
            <p className="text-xl font-semibold text-green-600">
              - Rs.{" "}
              {order.discountAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">
              Rs.{" "}
              {order.totalAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Items</p>
            <p className="text-xl font-semibold">{itemsByVendor.reduce((total: number, v: any) => total + v.items.length, 0)}</p>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="border rounded-lg p-4 bg-muted/10 mb-6">
            <p className="text-sm font-medium mb-1">Order Notes</p>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items by Vendor */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {itemsByVendor.map((vendorGroup: any) => (
                <VendorOrderGroup
                  key={vendorGroup.vendorName}
                  vendorName={vendorGroup.vendorName}
                  items={vendorGroup.items}
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  isCustomer={false}
                  vendorStatus={vendorGroup.status}
                />
              ))}
            </div>
          </div>

          {/* Timeline */}
          {statusHistory && statusHistory.length > 0 && (
            <div>
              <OrderTimeline
                statusHistory={statusHistory}
                currentStatus={order.status}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bank Transfer Verification */}
          {order.status === "PENDING_VERIFICATION" && order.payment?.method === "BANK_TRANSFER" && (
            <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                <FileText className="w-5 h-5" />
                Payment Verification
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                This order was paid via bank transfer and requires manual verification.
              </p>
              
              {order.payment.paymentSlipUrl && (
                <div className="mb-4">
                  <a 
                    href={order.payment.paymentSlipUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Uploaded Slip
                  </a>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleVerifyPayment("APPROVE")}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleVerifyPayment("REJECT")}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </h3>
            <div className="text-sm space-y-2">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer ID</p>
                <p className="font-medium text-xs">{order.customerId}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.province}
              </p>
              <p>{order.shippingAddress.postalCode}</p>
              <p className="pt-2 text-muted-foreground">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          {order.payment && (
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">
                    {order.payment.status.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium">
                    {order.payment.method}
                  </span>
                </div>
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium">
                      {format(new Date(order.payment.paidAt), "PPP")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coupon Applied */}
          {order.couponSnapshot && (
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Coupon Applied
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-medium">
                    {order.couponSnapshot.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium text-green-600">
                    {order.couponSnapshot.discountType === "PERCENTAGE"
                      ? `${order.couponSnapshot.discountValue}%`
                      : `Rs. ${order.couponSnapshot.discountValue}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {order.status === "CANCELLED" && order.cancelReason && (
            <div className="border rounded-lg p-4 bg-card border-destructive">
              <h3 className="font-semibold mb-3 text-destructive">
                Cancellation
              </h3>
              <div className="text-sm space-y-2">
                <div>
                  <p className="text-muted-foreground">Reason:</p>
                  <p className="whitespace-pre-wrap">{order.cancelReason}</p>
                </div>
                {order.cancelledAt && (
                  <div>
                    <p className="text-muted-foreground">Cancelled on:</p>
                    <p>{format(new Date(order.cancelledAt), "PPP")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Override Status Dialog */}
      <OverrideStatusDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.status}
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        onSuccess={fetchOrderDetails}
      />
    </div>
  );
}
