"use client";

import { PayoutWithVendor } from "@/types/wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  getPayoutStatusBadge,
} from "@/lib/utils/formatters";
import { format } from "date-fns";
import {
  Building2,
  Mail,
  CreditCard,
  Calendar,
  FileText,
  Wallet,
} from "lucide-react";

interface PayoutDetailsModalProps {
  payout: PayoutWithVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayoutDetailsModal({
  payout,
  open,
  onOpenChange,
}: PayoutDetailsModalProps) {
  if (!payout) return null;

  const statusBadge = getPayoutStatusBadge(payout.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payout Details</DialogTitle>
          <DialogDescription>
            Complete information about this payout request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Amount */}
          <div className="flex items-center justify-between">
            <Badge variant={statusBadge.variant} className="text-base px-3 py-1">
              {statusBadge.label}
            </Badge>
            <span className="text-2xl font-bold">
              {formatCurrency(payout.amount)}
            </span>
          </div>

          <Separator />

          {/* Vendor Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Vendor Information
            </h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Business Name:
                </span>
                <span className="text-sm font-medium text-right">
                  {payout.vendor.businessName}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email:
                </span>
                <span className="text-sm text-right">
                  {payout.vendor.businessEmail}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Vendor ID:
                </span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {payout.vendor.id}
                </code>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Details
            </h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Bank:</span>
                <span className="text-sm font-medium">{payout.bankName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Account Number:
                </span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {payout.accountNumber}
                </code>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Account Holder:
                </span>
                <span className="text-sm font-medium">
                  {payout.accountHolder}
                </span>
              </div>
              {payout.branchCode && (
                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">
                    Branch Code:
                  </span>
                  <span className="text-sm">{payout.branchCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Balance Snapshot */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Vendor Wallet Balance
            </h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Balance:
                </span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(payout.wallet.pendingBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Available Balance:
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(payout.wallet.availableBalance)}
                </span>
              </div>
              {payout.status === "PENDING" &&
                payout.wallet.availableBalance < payout.amount && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ Insufficient balance to process this payout
                  </div>
                )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Requested:
                </span>
                <span className="text-sm">
                  {format(new Date(payout.createdAt), "PPp")}
                </span>
              </div>
              {payout.processedAt && (
                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">
                    Processed:
                  </span>
                  <span className="text-sm">
                    {format(new Date(payout.processedAt), "PPp")}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated:
                </span>
                <span className="text-sm">
                  {format(new Date(payout.updatedAt), "PPp")}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Reference */}
          {payout.transactionRef && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Transaction Reference</h3>
              <div className="rounded-lg border p-4">
                <code className="text-sm font-mono bg-muted px-3 py-2 rounded block">
                  {payout.transactionRef}
                </code>
              </div>
            </div>
          )}

          {/* Notes */}
          {payout.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{payout.notes}</p>
              </div>
            </div>
          )}

          {/* Payout ID */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Payout ID:</span>
              <code className="bg-muted px-2 py-1 rounded">{payout.id}</code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
