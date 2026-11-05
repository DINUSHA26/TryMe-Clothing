/**
 * Omnichannel Revenue Card
 * Displays a clear 3-channel financial breakdown for vendors:
 * 1. TryMe.lk Marketplace (Platform Escrow Wallet)
 * 2. Standalone Website (Direct COD & Bank Deposit)
 * 3. In-Store POS System (Direct Cash Drawer & Card Terminal)
 */

"use client";

import { OmnichannelEarnings } from "@/types/wallet";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Store,
  Globe,
  MonitorDot,
  CheckCircle2,
  Info,
  DollarSign,
  ShoppingCart,
  Banknote,
  Receipt,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface OmnichannelRevenueCardProps {
  channels?: OmnichannelEarnings;
  isLoading?: boolean;
}

export function OmnichannelRevenueCard({
  channels,
  isLoading = false,
}: OmnichannelRevenueCardProps) {
  if (isLoading) {
    return (
      <div className="border rounded-2xl p-6 bg-card space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const trymeSales = channels?.trymeSales || 0;
  const trymeOrders = channels?.trymeOrders || 0;
  const websiteSales = channels?.websiteSales || 0;
  const websiteOrders = channels?.websiteOrders || 0;
  const posSales = channels?.posSales || 0;
  const posOrders = channels?.posOrders || 0;
  const totalRevenue = channels?.totalAllChannelsRevenue || (trymeSales + websiteSales + posSales);
  const totalTransactions = trymeOrders + websiteOrders + posOrders;

  return (
    <div className="border rounded-2xl p-6 bg-card space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Omnichannel Revenue &amp; Earnings Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clear breakdown of your revenue across all 3 distinct sales channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold text-muted-foreground">All Channels Total:</span>
          <span className="text-sm font-black text-primary px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* 3 Channels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Channel 1: TryMe.lk Marketplace */}
        <div className="rounded-2xl border-2 border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">TryMe.lk Marketplace</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                Wallet Escrow
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Gross Sales</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {formatCurrency(trymeSales)}
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{trymeOrders} marketplace order(s)</span>
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Customer payments held in TryMe.lk escrow and released to your <strong>Available Balance</strong> upon delivery.
            </p>
          </div>

          <div className="pt-2 border-t border-blue-500/10 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Withdrawable via Payout Request</span>
          </div>
        </div>

        {/* Channel 2: Standalone Website Direct Store */}
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">My Standalone Website</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                Direct to Vendor
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Direct Sales (COD / Bank)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(websiteSales)}
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>{websiteOrders} website order(s)</span>
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Direct storefront orders paid to you via <strong>Cash on Delivery (COD)</strong> or directly into your <strong>Private Bank Account</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-500/10 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <Banknote className="w-3.5 h-3.5" />
            <span>Already collected directly by you</span>
          </div>
        </div>

        {/* Channel 3: In-Store POS Retail Counter */}
        <div className="rounded-2xl border-2 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MonitorDot className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">In-Store POS Register</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                Physical Cash / Card
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Retail Counter Sales</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(posSales)}
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{posOrders} walk-in receipt(s)</span>
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Walk-in physical customer purchases processed at your <strong>POS Counter</strong> (Cash in cash drawer or shop terminal).
            </p>
          </div>

          <div className="pt-2 border-t border-amber-500/10 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <Banknote className="w-3.5 h-3.5" />
            <span>Immediate in-hand cash / terminal funds</span>
          </div>
        </div>
      </div>

      {/* Helpful Guidance Banner */}
      <div className="rounded-xl p-4 bg-muted/30 border text-xs text-muted-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            How payouts work across your channels:
          </p>
          <p className="leading-relaxed">
            Only <strong>TryMe.lk Marketplace</strong> sales are paid through the Wallet withdrawal system above. Your <strong>Website Orders</strong> (collected via COD or your bank account) and <strong>In-Store POS sales</strong> (collected at your physical counter) are already received directly by your business.
          </p>
        </div>
      </div>
    </div>
  );
}
