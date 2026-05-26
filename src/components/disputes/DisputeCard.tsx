import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisputeStatusBadge } from './DisputeStatusBadge';
import {
  DisputeListItem,
  DISPUTE_REASON_LABELS,
  DisputeReason,
  DisputeStatus,
} from '@/types/dispute';
import { MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DisputeCardProps {
  dispute: DisputeListItem;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                Order #{dispute.order.orderNumber}
              </h3>
              <DisputeStatusBadge status={dispute.status as DisputeStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {DISPUTE_REASON_LABELS[dispute.reason as DisputeReason]}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Rs. {Number(dispute.order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {dispute.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(dispute.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{dispute._count.comments} comments</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/my-disputes/${dispute.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
