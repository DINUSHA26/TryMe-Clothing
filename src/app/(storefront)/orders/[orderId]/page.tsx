/**
 * Customer Order Details Page
 * Shows complete order information with timeline, items, and actions
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderDetails } from "@/lib/services/order-service";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { VendorOrderGroup } from "@/components/orders/VendorOrderGroup";
import { OrderActions } from "@/components/orders/OrderActions";
import { format } from "date-fns";
import { Package, MapPin, CreditCard, ArrowLeft, Store, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
  searchParams?: Promise<{
    package?: string;
  }>;
}

async function getOrderDetailsDirectCall(orderId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const headersList = await headers();
  const xUserId = headersList.get("X-User-Id");
  const xUserRole = headersList.get("X-User-Role");

  if (!accessToken && !xUserId) {
    return null;
  }

  // Verification is handled by middleware
  const userId = xUserId;
  if (!userId) return null;

  try {
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    const data = await getOrderDetails(orderId, {
      userId,
      role: xUserRole || "CUSTOMER",
      customerId: customer?.id,
    });
    
    return data;
  } catch (error: any) {
    console.error("[OrderDetailPage] Error:", error);
    return null;
  }
}

export default async function OrderDetailsPage({
  params,
  searchParams,
}: OrderDetailsPageProps) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activePackageVendorId = resolvedSearchParams.package;

  const orderData = await getOrderDetailsDirectCall(orderId);

  if (!orderData) {
    redirect("/orders");
  }

  const { order } = orderData;
  const { statusHistory, itemsByVendor, actions } = order;

  const isMultiVendor = itemsByVendor.length > 1;

  const packagesList = itemsByVendor.map((vg: any) => ({
    vendorId: vg.vendorId,
    vendorName: vg.vendorName,
  }));

  // Filter items by vendor if specific package is selected in URL
  const displayedVendorGroups =
    activePackageVendorId && activePackageVendorId !== "all"
      ? itemsByVendor.filter((vg: any) => vg.vendorId === activePackageVendorId)
      : itemsByVendor;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/orders">
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
          <OrderStatusBadge status={order.status} items={order.items} />
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="border rounded-lg p-4 bg-muted/10 mb-6">
            <p className="text-sm font-medium mb-1">Order Notes</p>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="mb-6">
            <OrderActions
              orderId={order.id}
              orderNumber={order.orderNumber}
              actions={actions}
              isMultiVendor={isMultiVendor}
              singleVendorId={!isMultiVendor ? (itemsByVendor as any[])[0]?.vendorId : undefined}
              singleVendorName={!isMultiVendor ? (itemsByVendor as any[])[0]?.vendorName : undefined}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items by Vendor / Packages */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span>
                  {isMultiVendor
                    ? `Order Packages (${itemsByVendor.length} Stores)`
                    : "Order Items"}
                </span>
              </h2>

              {isMultiVendor && (
                <span className="text-xs text-muted-foreground font-medium">
                  Confirm delivery separately for each store as they arrive
                </span>
              )}
            </div>

            {/* Package / Sub-Order Tabs when order has multiple stores */}
            {isMultiVendor && (
              <div className="mb-4 overflow-x-auto pb-1">
                <div className="inline-flex items-center gap-1.5 p-1 bg-muted rounded-xl flex-wrap">
                  <Link
                    href={`/orders/${order.id}`}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !activePackageVendorId || activePackageVendorId === "all"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Packages ({itemsByVendor.length})
                  </Link>
                  {itemsByVendor.map((vg: any, idx: number) => {
                    const isSelected = activePackageVendorId === vg.vendorId;
                    return (
                      <Link
                        key={vg.vendorId}
                        href={`/orders/${order.id}?package=${vg.vendorId}`}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{vg.vendorName}</span>
                        <span className="text-[10px] opacity-80">
                          (Package #{idx + 1})
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {displayedVendorGroups.map((vendorGroup: any, idx: number) => (
                <VendorOrderGroup
                  key={vendorGroup.vendorId || vendorGroup.vendorName}
                  vendorId={vendorGroup.vendorId}
                  vendorName={vendorGroup.vendorName}
                  items={vendorGroup.items}
                  chatRoomId={vendorGroup.chatRoomId}
                  orderStatus={order.status}
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  deliveryConfirmedAt={order.deliveryConfirmedAt}
                  isCustomer={true}
                  vendorStatus={vendorGroup.status}
                  packageIndex={idx + 1}
                  totalPackages={itemsByVendor.length}
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
                packages={packagesList}
              />
            </div>
          )}
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
                Payment Information
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
              <h3 className="font-semibold mb-3">Coupon Applied</h3>
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
        </div>
      </div>
    </div>
  );
}
