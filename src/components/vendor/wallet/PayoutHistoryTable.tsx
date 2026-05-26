"use client";

import { useState } from "react";
import { PayoutRequest } from "@/types/wallet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  getPayoutStatusBadge,
} from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayoutHistoryTableProps {
  payouts: PayoutRequest[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onCancelSuccess: () => void;
  isLoading?: boolean;
}

export function PayoutHistoryTable({
  payouts,
  pagination,
  onPageChange,
  onCancelSuccess,
  isLoading = false,
}: PayoutHistoryTableProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const handleCancelClick = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedPayoutId) return;

    setIsCancelling(true);

    try {
      const response = await fetch(
        `/api/vendor/wallet/payouts/${selectedPayoutId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to cancel payout");
      }

      toast({
        title: "Payout Cancelled",
        description: "Your payout request has been cancelled successfully",
      });

      setCancelDialogOpen(false);
      setSelectedPayoutId(null);
      onCancelSuccess();
    } catch (error: any) {
      console.error("Error cancelling payout:", error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel payout",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No payout requests yet. Request your first payout to withdraw your
          earnings.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                const statusBadge = getPayoutStatusBadge(payout.status);

                return (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      {format(new Date(payout.createdAt), "PPp")}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {payout.bankName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.accountNumber} - {payout.accountHolder}
                        </p>
                        {payout.branchCode && (
                          <p className="text-xs text-muted-foreground">
                            Branch: {payout.branchCode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payout.transactionRef ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payout.transactionRef}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payout.processedAt ? (
                        format(new Date(payout.processedAt), "PP")
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payout.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelClick(payout.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalCount
              )}{" "}
              of {pagination.totalCount} payouts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payout Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this payout request? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              No, Keep It
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Payout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
