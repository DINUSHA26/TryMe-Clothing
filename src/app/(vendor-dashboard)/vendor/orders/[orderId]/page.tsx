/**
 * Vendor Order Details Page
 * Shows order details for vendor's items with update status form
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVendorOrderDetail } from "@/lib/services/vendor-order-service";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderItemCard } from "@/components/orders/OrderItemCard";
import { UpdateOrderItemStatusForm } from "@/components/vendor/orders/UpdateOrderItemStatusForm";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCustomerButton } from "@/components/chat/MessageCustomerButton";

interface VendorOrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

async function getVendorOrderDetailsDirectCall(orderId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  // Verify token
  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  try {
    // Look up vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: payload.userId },
    });
    
    if (!vendorRecord) {
      return null;
    }

    const data = await getVendorOrderDetail(vendorRecord.id, orderId);
    return data;
  } catch (error: any) {
    console.error("[VendorOrderDetailPage] Error:", error);
    return null;
  }
}

export default async function VendorOrderDetailsPage({
  params,
}: VendorOrderDetailsPageProps) {
  const { orderId } = await params;
  const data = await getVendorOrderDetailsDirectCall(orderId);

  if (!data) {
    redirect("/vendor/orders");
  }

  const { order, vendorItems, shippingAddress } = data;

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link href="/vendor/orders">
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
          <OrderStatusBadge status={order.status} items={vendorItems} />
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Customer</p>
            <p className="font-medium">{order.customerEmail}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">Your Items</p>
            <p className="text-xl font-semibold">{vendorItems.length}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-1">
              Total (Your Items)
            </p>
            <div className="flex flex-col">
              <p className="text-xl font-semibold">
                Rs.{" "}
                {vendorItems
                  .reduce((sum: number, item: any) => sum + (item.discountedTotalPrice ?? item.totalPrice), 0)
                  .toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </p>
              {vendorItems.reduce((sum: number, item: any) => sum + (item.discountAmount || 0), 0) > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Includes Rs. {vendorItems.reduce((sum: number, item: any) => sum + (item.discountAmount || 0), 0).toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} total discount
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Your Items */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Your Items
            </h2>
            <div className="space-y-6">
              {vendorItems.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <OrderItemCard
                    id={item.id}
                    productSnapshot={item.productSnapshot}
                    variantSnapshot={item.variantSnapshot}
                    quantity={item.quantity}
                    unitPrice={item.unitPrice}
                    totalPrice={item.totalPrice}
                    discountAmount={item.discountAmount}
                    discountedTotalPrice={item.discountedTotalPrice}
                    status={item.status}
                    showStatus={true}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    isCustomer={false}
                  />

                  {/* Tracking Info (if available) */}
                  {item.trackingNumber && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">
                        Tracking Information
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tracking #: {item.trackingNumber}
                      </p>
                      {item.trackingUrl && (
                        <a
                          href={item.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Track shipment →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Chat with Customer */}
                  <div className="pt-2">
                    <MessageCustomerButton orderItemId={item.id} />
                  </div>

                  {/* Update Status Form */}
                  {(item.status === "PAYMENT_CONFIRMED" ||
                    item.status === "PROCESSING") && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold mb-3">
                        Update Item Status
                      </h3>
                      <UpdateOrderItemStatusForm
                        orderItemId={item.id}
                        currentStatus={item.status}
                        productName={item.productSnapshot.name}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{shippingAddress.fullName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && (
                <p>{shippingAddress.addressLine2}</p>
              )}
              <p>
                {shippingAddress.city}, {shippingAddress.province}
              </p>
              <p>{shippingAddress.postalCode}</p>
              <p className="pt-2 text-muted-foreground">
                Phone: {shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-3">Order Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
