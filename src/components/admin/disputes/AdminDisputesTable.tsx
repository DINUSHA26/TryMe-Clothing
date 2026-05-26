'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge';
import {
  DisputeListItem,
  DISPUTE_REASON_LABELS,
  DisputeReason,
  DisputeStatus,
} from '@/types/dispute';
import { Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminDisputesTableProps {
  disputes: DisputeListItem[];
}

export function AdminDisputesTable({ disputes }: AdminDisputesTableProps) {
  if (disputes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No disputes found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disputes.map((dispute) => (
            <TableRow key={dispute.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${dispute.orderId}`}
                  className="font-medium hover:underline"
                >
                  {dispute.order.orderNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium">
                    {dispute.customer.user.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {DISPUTE_REASON_LABELS[dispute.reason as DisputeReason]}
                </span>
              </TableCell>
              <TableCell>
                <DisputeStatusBadge status={dispute.status as DisputeStatus} />
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  Rs. {Number(dispute.order.totalAmount).toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{dispute._count.comments}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(dispute.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/disputes/${dispute.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
