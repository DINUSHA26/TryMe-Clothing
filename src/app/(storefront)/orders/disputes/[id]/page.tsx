import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { tokenUtils } from '@/lib/auth';
import { getServerAppUrl } from '@/lib/server-env';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge';
import { DisputeComments } from '@/components/disputes/DisputeComments';
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
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface DisputeDetailsPageProps {
  params: {
    id: string;
  };
}

async function getDisputeDetails(disputeId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  const appUrl = await getServerAppUrl();
  const response = await fetch(
    `${appUrl}/api/disputes/${disputeId}`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function DisputeDetailsPage({
  params,
}: DisputeDetailsPageProps) {
  const { id } = await params;
  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await tokenUtils.verifyAccessToken(token);
  if (!payload) {
    redirect('/login');
  }

  // Fetch dispute details
  const result = await getDisputeDetails(id);

  if (!result || !result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">Dispute not found</p>
          <Link href="/orders/disputes">
            <Button variant="outline" className="mt-4">
              Back to Disputes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { dispute } = result.data;

  // Check if customer can comment
  const canComment =
    dispute.status !== DisputeStatus.RESOLVED_CUSTOMER_FAVOR &&
    dispute.status !== DisputeStatus.RESOLVED_VENDOR_FAVOR &&
    dispute.status !== DisputeStatus.CLOSED;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/orders/disputes">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Disputes
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Dispute #{dispute.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Order #{dispute.order.orderNumber}
          </p>
        </div>
        <DisputeStatusBadge status={dispute.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Reason</h3>
                <p className="text-muted-foreground">
                  {DISPUTE_REASON_LABELS[dispute.reason as DisputeReason]}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>

              {/* Evidence */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Evidence</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {dispute.evidence.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Calendar className="h-4 w-4" />
                <span>
                  Opened on {format(new Date(dispute.createdAt), 'PPpp')}
                </span>
              </div>

              {dispute.resolvedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Resolved on {format(new Date(dispute.resolvedAt), 'PPpp')}
                  </span>
                </div>
              )}

              {dispute.resolution && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Admin Resolution</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {dispute.resolution}
                  </p>
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
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="font-semibold">
                  {dispute.order.payment?.method || 'N/A'}
                </p>
              </div>
              <Link href={`/orders/${dispute.order.id}`}>
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

          {/* Help */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                An admin will review your dispute and respond through comments.
                You'll be notified of any updates.
              </p>
              <p className="text-sm text-muted-foreground">
                Response time: Usually within 24-48 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
