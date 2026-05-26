"use client";

import { useState, useEffect } from "react";
import { WalletTransactionType } from "@prisma/client";
import { WalletData, WalletTransactionsResponse, PayoutsResponse } from "@/types/wallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletBalanceCard } from "@/components/vendor/wallet/WalletBalanceCard";
import { WalletStats } from "@/components/vendor/wallet/WalletStats";
import { TransactionHistoryTable } from "@/components/vendor/wallet/TransactionHistoryTable";
import { PayoutRequestForm } from "@/components/vendor/wallet/PayoutRequestForm";
import { PayoutHistoryTable } from "@/components/vendor/wallet/PayoutHistoryTable";
import { useToast } from "@/hooks/use-toast";

export default function VendorWalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionsResponse | null>(null);
  const [payouts, setPayouts] = useState<PayoutsResponse | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(true);
  const [payoutFormOpen, setPayoutFormOpen] = useState(false);

  // Transaction filters
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionType, setTransactionType] = useState<WalletTransactionType | "ALL">("ALL");

  // Payout filters
  const [payoutPage, setPayoutPage] = useState(1);

  const { toast } = useToast();

  // Fetch wallet data
  const fetchWalletData = async () => {
    setIsLoadingWallet(true);
    try {
      const response = await fetch("/api/vendor/wallet");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch wallet");
      }

      setWalletData(result.data);
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams({
        page: transactionPage.toString(),
        pageSize: "50",
      });

      if (transactionType !== "ALL") {
        params.append("type", transactionType);
      }

      const response = await fetch(`/api/vendor/wallet/transactions?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }

      setTransactions(result.data);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Fetch payouts
  const fetchPayouts = async () => {
    setIsLoadingPayouts(true);
    try {
      const params = new URLSearchParams({
        page: payoutPage.toString(),
        pageSize: "20",
      });

      const response = await fetch(`/api/vendor/wallet/payouts?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch payouts");
      }

      setPayouts(result.data);
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payouts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchPayouts();
  }, []);

  // Reload transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [transactionPage, transactionType]);

  // Reload payouts when page changes
  useEffect(() => {
    fetchPayouts();
  }, [payoutPage]);

  // Handle payout request success
  const handlePayoutSuccess = () => {
    fetchWalletData();
    fetchPayouts();
  };

  // Handle payout cancel success
  const handlePayoutCancelSuccess = () => {
    fetchWalletData();
    fetchPayouts();
  };

  const hasPendingPayout = (walletData?.stats?.pendingPayouts ?? 0) > 0;
  const availableBalance = walletData?.balance?.availableBalance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">
          Manage your earnings and request payouts
        </p>
      </div>

      {/* Wallet Balance Card */}
      <WalletBalanceCard
        balance={walletData?.balance || null}
        onRequestPayout={() => setPayoutFormOpen(true)}
        isLoading={isLoadingWallet}
      />

      {/* Wallet Stats */}
      <WalletStats
        stats={walletData?.stats || null}
        availableBalance={availableBalance}
        isLoading={isLoadingWallet}
      />

      {/* Tabs: Transactions & Payouts */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionHistoryTable
            transactions={transactions?.transactions || []}
            pagination={
              transactions?.pagination || {
                page: 1,
                pageSize: 50,
                totalCount: 0,
                totalPages: 0,
              }
            }
            onPageChange={setTransactionPage}
            onTypeFilter={setTransactionType}
            selectedType={transactionType}
            isLoading={isLoadingTransactions}
          />
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <PayoutHistoryTable
            payouts={payouts?.payouts || []}
            pagination={
              payouts?.pagination || {
                page: 1,
                pageSize: 20,
                totalCount: 0,
                totalPages: 0,
              }
            }
            onPageChange={setPayoutPage}
            onCancelSuccess={handlePayoutCancelSuccess}
            isLoading={isLoadingPayouts}
          />
        </TabsContent>
      </Tabs>

      {/* Payout Request Form Dialog */}
      <PayoutRequestForm
        open={payoutFormOpen}
        onOpenChange={setPayoutFormOpen}
        availableBalance={availableBalance}
        hasPendingPayout={hasPendingPayout}
        onSuccess={handlePayoutSuccess}
      />
    </div>
  );
}
