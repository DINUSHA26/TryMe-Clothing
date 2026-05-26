"use client";

import { useState } from "react";
import { PayoutWithVendor } from "@/types/wallet";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  getPayoutStatusBadge,
} from "@/lib/utils/formatters";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface PayoutsTableProps {
  payouts: PayoutWithVendor[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails: (payout: PayoutWithVendor) => void;
  onProcess: (payout: PayoutWithVendor) => void;
  onComplete: (payout: PayoutWithVendor) => void;
  onFail: (payout: PayoutWithVendor) => void;
  isLoading?: boolean;
}

export function PayoutsTable({
  payouts,
  pagination,
  onPageChange,
  onViewDetails,
  onProcess,
  onComplete,
  onFail,
  isLoading = false,
}: PayoutsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No payout requests found. Payout requests from vendors will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Wallet Balance</TableHead>
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
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {payout.vendor.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.vendor.businessEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(payout.amount)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{payout.bankName}</p>
                      <p className="text-xs text-muted-foreground">
                        {payout.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.accountHolder}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-muted-foreground">Pending:</span>{" "}
                        <span className="font-medium">
                          {formatCurrency(payout.wallet.pendingBalance)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Available:
                        </span>{" "}
                        <span className="font-medium text-green-600">
                          {formatCurrency(payout.wallet.availableBalance)}
                        </span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Details Button (Always Available) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(payout)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Process Button (PENDING) */}
                      {payout.status === "PENDING" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onProcess(payout)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}

                      {/* Complete Button (PROCESSING) */}
                      {payout.status === "PROCESSING" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onComplete(payout)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFail(payout)}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Fail
                          </Button>
                        </>
                      )}
                    </div>
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
  );
}
