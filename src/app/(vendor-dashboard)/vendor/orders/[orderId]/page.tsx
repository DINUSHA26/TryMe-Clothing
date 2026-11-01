/**
 * Vendor Order Details Page
 * Shows order details for vendor's items with full support for both TryMe Marketplace Orders and Direct Website Orders (COD / Bank Deposit)
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
import {
  ArrowLeft,
  MapPin,
  Package,
  Globe,
  Store,
  CreditCard,
  Banknote,
  ExternalLink,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  try {
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
  const isWebsiteOrder = order.orderSource === "VENDOR_WEBSITE";
  const cleanPhone = (shippingAddress?.phone || "").replace(/[^0-9]/g, "");

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Back Button */}
      <Link href={`/vendor/orders?source=${isWebsiteOrder ? "website" : "tryme"}`}>
        <Button variant="ghost" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {isWebsiteOrder ? "My Website Orders" : "TryMe.lk Orders"}
        </Button>
      </Link>

      {/* Order Header */}
      <div className="border rounded-2xl p-6 bg-card shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isWebsiteOrder ? (
                <Badge className="bg-indigo-600 text-white font-bold inline-flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Direct Website Order</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="font-bold inline-flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>TryMe.lk Marketplace Order</span>
                </Badge>
              )}

              <Badge
                variant="secondary"
                className="font-bold inline-flex items-center gap-1"
              >
                {order.paymentMethod === "COD" ? (
                  <>
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </>
                ) : order.paymentMethod === "BANK_DEPOSIT" ? (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank Deposit</span>
                  </>
                ) : (
                  <span>{order.paymentMethod}</span>
                )}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {format(new Date(order.createdAt), "PPP 'at' p")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello ${shippingAddress?.fullName || "Customer"}, regarding your Order #${
                    order.orderNumber
                  } (Status: ${order.status.replace(/_/g, " ")})...`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  WhatsApp Customer
                </Button>
              </a>
            )}
            <OrderStatusBadge status={order.status} items={vendorItems} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Customer</p>
            <p className="font-bold text-sm">{shippingAddress?.fullName || "Customer"}</p>
            <p className="text-xs text-muted-foreground truncate">{order.customerEmail}</p>
          </div>
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Payment Method</p>
            <p className="font-bold text-sm">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery (COD)"
                : order.paymentMethod === "BANK_DEPOSIT"
                ? "Bank Deposit / Transfer"
                : order.paymentMethod}
            </p>
            {order.bankReference && (
              <p className="text-xs text-muted-foreground">Ref: {order.bankReference}</p>
            )}
          </div>
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Items Count</p>
            <p className="text-xl font-bold">{vendorItems.length} item(s)</p>
            {order.shippingAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                + Rs. {order.shippingAmount.toLocaleString()} Delivery
              </p>
            )}
          </div>
          <div className="border rounded-xl p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              Order Total
            </p>
            <p className="text-xl font-bold text-primary">
              Rs.{" "}
              {(isWebsiteOrder
                ? order.totalAmount
                : vendorItems.reduce(
                    (sum: number, item: any) =>
                      sum + (item.discountedTotalPrice ?? item.totalPrice),
                    0
                  )
              ).toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bank Deposit Slip Viewer (if Bank Deposit order) */}
          {order.paymentMethod === "BANK_DEPOSIT" && (
            <div className="border-2 border-blue-500/20 bg-blue-500/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base">Bank Deposit Verification</h3>
                </div>
                {order.paymentSlipUrl ? (
                  <a
                    href={order.paymentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="font-bold text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Full Bank Slip
                    </Button>
                  </a>
                ) : (
                  <Badge variant="outline">No Slip Image Uploaded</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {order.bankReference
                  ? `Customer provided Bank Reference: ${order.bankReference}. `
                  : ""}
                Verify the deposit in your bank account and use the status updater below to mark the order as Confirmed or Processing.
              </p>
            </div>
          )}

          {/* Ordered Items & Status Management */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ordered Items &amp; Status Management
            </h2>
            <div className="space-y-6">
              {vendorItems.map((item: any) => (
                <div key={item.id} className="border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
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

                  {/* Tracking Info */}
                  {item.trackingNumber && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">Tracking Information</p>
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

                  {/* Chat with Customer (for TryMe Marketplace orders) */}
                  {!isWebsiteOrder && (
                    <div className="pt-2">
                      <MessageCustomerButton orderItemId={item.id} />
                    </div>
                  )}

                  {/* Update Status Form */}
                  {(isWebsiteOrder ||
                    item.status === "PAYMENT_CONFIRMED" ||
                    item.status === "PROCESSING") && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-bold mb-3">
                        {isWebsiteOrder
                          ? "Manage Website Order Status (Full Control)"
                          : "Update Item Status"}
                      </h3>
                      <UpdateOrderItemStatusForm
                        orderItemId={item.id}
                        currentStatus={item.status}
                        productName={item.productSnapshot.name}
                        isWebsiteOrder={isWebsiteOrder}
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
          {/* Shipping Address & Direct Contact */}
          <div className="border rounded-2xl p-5 bg-card space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Customer &amp; Delivery Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-base">{shippingAddress?.fullName}</p>
              <p>{shippingAddress?.addressLine1}</p>
              {shippingAddress?.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>
                {shippingAddress?.city}
                {shippingAddress?.province ? `, ${shippingAddress.province}` : ""}
              </p>
              {shippingAddress?.postalCode && <p>{shippingAddress.postalCode}</p>}
            </div>

            <div className="pt-3 border-t space-y-2 text-xs">
              {shippingAddress?.phone && (
                <a
                  href={`tel:${shippingAddress.phone}`}
                  className="flex items-center gap-2 font-semibold text-foreground hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{shippingAddress.phone}</span>
                </a>
              )}
              {order.customerEmail && (
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-2 font-semibold text-foreground hover:underline"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{order.customerEmail}</span>
                </a>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="border rounded-2xl p-5 bg-card">
              <h3 className="font-bold mb-2">Order Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
