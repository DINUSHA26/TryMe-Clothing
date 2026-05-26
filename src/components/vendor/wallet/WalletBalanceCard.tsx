"use client";

import { WalletBalance } from "@/types/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/formatters";
import { Wallet, TrendingUp, DollarSign, ArrowDownToLine } from "lucide-react";

interface WalletBalanceCardProps {
  balance: WalletBalance | null;
  onRequestPayout: () => void;
  isLoading?: boolean;
}

export function WalletBalanceCard({
  balance,
  onRequestPayout,
  isLoading = false,
}: WalletBalanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Balance
            </span>
            <Skeleton className="h-10 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No wallet data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </span>
          <Button onClick={onRequestPayout} className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Request Payout
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Available Balance - Primary Display */}
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-6 border border-green-200 dark:border-green-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {formatCurrency(balance.availableBalance)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                  Ready to withdraw
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Other Balance Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending Balance */}
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200 dark:border-orange-900">
              <p className="text-xs font-medium text-orange-800 dark:text-orange-400 mb-1">
                Pending Balance
              </p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-300">
                {formatCurrency(balance.pendingBalance)}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">
                Awaiting delivery
              </p>
            </div>

            {/* Total Earnings */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-medium text-blue-800 dark:text-blue-400">
                  Total Earnings
                </p>
              </div>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                {formatCurrency(balance.totalEarnings)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                Lifetime net
              </p>
            </div>

            {/* Total Withdrawn */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-950/20 p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-400 mb-1">
                Total Withdrawn
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-300">
                {formatCurrency(balance.totalWithdrawn)}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-500 mt-1">
                All payouts
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
