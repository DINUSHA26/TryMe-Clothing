import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { tokenUtils } from '@/lib/auth';
import { getServerAppUrl } from '@/lib/server-env';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge';
import { DisputeComments } from '@/components/disputes/DisputeComments';
import { ResolveDisputeActionBlock } from '@/components/admin/disputes/ResolveDisputeActionBlock';
import { EvidenceGallery } from '@/components/admin/disputes/EvidenceGallery';
import { OrderItemCard } from '@/components/orders/OrderItemCard';
import {
  DISPUTE_REASON_LABELS,
  DisputeReason,
  DisputeStatus,
} from '@/types/dispute';
import {
  ArrowLeft,
  Calendar,
  Package,
  MapPin,
  User,
  MessageSquare,
  ShoppingCart,
  Scale,
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminDisputeDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getDisputeDetails(disputeId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  const appUrl = await getServerAppUrl();
  const response = await fetch(
    `${appUrl}/api/admin/disputes/${disputeId}`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    console.error(`[getDisputeDetails] Fetch failed with status ${response.status}:`, await response.text());
    return null;
  }

  return response.json();
}

export default async function AdminDisputeDetailsPage({
  params,
}: AdminDisputeDetailsPageProps) {
  const { id } = await params;
  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/staff/login');
  }

  const payload = await tokenUtils.verifyAccessToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    redirect('/staff/login');
  }

  // Fetch dispute details
  const result = await getDisputeDetails(id);

  if (!result || !result.success) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-500">Dispute not found</p>
          <Link href="/admin/disputes">
            <Button variant="outline" className="mt-4">
              Back to Disputes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { dispute, chatHistory, refundCalculation, customerContext } = result.data;

  // Check if dispute can be resolved
  const canResolve =
    dispute.status !== DisputeStatus.RESOLVED_CUSTOMER_FAVOR &&
    dispute.status !== DisputeStatus.RESOLVED_VENDOR_FAVOR &&
    dispute.status !== DisputeStatus.CLOSED;

  // Check if admin can comment
  const canComment =
    dispute.status !== DisputeStatus.RESOLVED_CUSTOMER_FAVOR &&
    dispute.status !== DisputeStatus.RESOLVED_VENDOR_FAVOR &&
    dispute.status !== DisputeStatus.CLOSED;

  return (
    <div className="p-8 space-y-8">
      {/* Back Button */}
      <Link href="/admin/disputes">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Disputes
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Dispute #{dispute.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Order #{dispute.order.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DisputeStatusBadge status={dispute.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dispute Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Reason</h3>
                  <p className="text-muted-foreground">
                    {DISPUTE_REASON_LABELS[dispute.reason as DisputeReason]}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(dispute.createdAt), 'PPpp')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>

              {/* Evidence */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Evidence ({dispute.evidence.length})</h3>
                  <EvidenceGallery evidence={dispute.evidence} />
                </div>
              )}

              {dispute.resolvedAt && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Resolved on {format(new Date(dispute.resolvedAt), 'PPpp')}
                    </span>
                  </div>
                  {dispute.resolution && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Admin Resolution
                      </h3>
                      <p className="text-sm whitespace-pre-wrap">
                        {dispute.resolution}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispute.order.items.map((item: any) => (
                <OrderItemCard key={item.id} {...item} />
              ))}
            </CardContent>
          </Card>

          {/* Chat History */}
          {chatHistory && chatHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat History ({chatHistory.length} room(s))
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {chatHistory.map((room: any) => (
                  <div key={room.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold mb-2">
                      {room.orderItem.product.name} - {room.orderItem.vendor.businessName}
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {room.messages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`text-sm p-2 rounded ${
                            msg.sender.role === 'CUSTOMER'
                              ? 'bg-muted'
                              : 'bg-blue-50 dark:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs">
                              {msg.sender.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.createdAt), 'PPp')}
                            </span>
                          </div>
                          <p>{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <DisputeComments
            disputeId={dispute.id}
            comments={dispute.comments}
            disputeStatus={dispute.status}
            canComment={canComment}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Panel */}
          {canResolve && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-red-500" />
                  Resolution Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  As an administrator, review the customer's claims and counter-evidence. Select a verdict to execute the final resolution.
                </p>
                <ResolveDisputeActionBlock
                  disputeId={dispute.id}
                  orderTotal={Number(dispute.order.totalAmount)}
                  refundCalculation={refundCalculation}
                />
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{dispute.customer.user.email}</p>
              </div>
              {dispute.customer.user.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{dispute.customer.user.phone}</p>
                </div>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{customerContext.totalOrders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-medium">
                    Rs. {customerContext.totalSpent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Disputes</span>
                  <span className="font-medium">{customerContext.totalDisputes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-semibold">{dispute.order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-lg">
                  Rs. {Number(dispute.order.totalAmount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Status</p>
                <p className="font-semibold">{dispute.order.status}</p>
              </div>
              <Link href={`/admin/orders/${dispute.order.id}`}>
                <Button variant="outline" className="w-full">
                  View Full Order
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {dispute.order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">
                    {dispute.order.shippingAddress.fullName}
                  </p>
                  <p className="text-muted-foreground">
                    {dispute.order.shippingAddress.addressLine1}
                  </p>
                  {dispute.order.shippingAddress.addressLine2 && (
                    <p className="text-muted-foreground">
                      {dispute.order.shippingAddress.addressLine2}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {dispute.order.shippingAddress.city},{' '}
                    {dispute.order.shippingAddress.province}{' '}
                    {dispute.order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">
                    {dispute.order.shippingAddress.phone}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
