"use client";

import { useState } from "react";
import { WalletTransactionItem } from "@/types/wallet";
import { WalletTransactionType } from "@prisma/client";
import { cn } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatAmountWithSign,
  getTransactionTypeBadge,
  isTransactionCredit,
  isTransactionDebit,
} from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface TransactionHistoryTableProps {
  transactions: WalletTransactionItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onTypeFilter: (type: WalletTransactionType | "ALL") => void;
  selectedType: WalletTransactionType | "ALL";
  isLoading?: boolean;
}

export function TransactionHistoryTable({
  transactions,
  pagination,
  onPageChange,
  onTypeFilter,
  selectedType,
  isLoading = false,
}: TransactionHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No transactions found
          {selectedType !== "ALL" && " with this filter"}
        </p>
        {selectedType !== "ALL" && (
          <Button
            variant="link"
            onClick={() => onTypeFilter("ALL")}
            className="mt-2"
          >
            Clear filter
          </Button>
        )}
      </div>
    );
  }

  const transactionTypes: Array<WalletTransactionType | "ALL"> = [
    "ALL",
    "HOLD",
    "COMMISSION",
    "RELEASE",
    "REFUND",
    "PAYOUT",
    "CREDIT",
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedType}
            onValueChange={(value) =>
              onTypeFilter(value as WalletTransactionType | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "ALL" ? "All Types" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const badge = getTransactionTypeBadge(transaction.type);
              const isCredit = isTransactionCredit(transaction.type);
              const isDebit = isTransactionDebit(transaction.type);

              const badgeColors: Record<WalletTransactionType, string> = {
                HOLD: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
                RELEASE: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
                COMMISSION: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
                REFUND: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
                PAYOUT: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50",
                CREDIT: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
                DEBIT: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
              };

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.createdAt), "PPp")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold border shadow-none",
                        badgeColors[transaction.type]
                      )}
                    >
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm">{transaction.description}</p>
                    {transaction.metadata?.orderNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Order: {transaction.metadata.orderNumber}
                      </p>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      isCredit
                        ? "text-green-600 dark:text-green-400"
                        : isDebit
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {isCredit
                      ? `+${formatCurrency(transaction.amount)}`
                      : isDebit
                      ? `-${formatCurrency(transaction.amount)}`
                      : formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.balanceAfter)}
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
            of {pagination.totalCount} transactions
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
