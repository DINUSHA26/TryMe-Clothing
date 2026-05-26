import { WalletTransactionType, PayoutStatus } from "@prisma/client";

/**
 * Wallet balance information
 */
export interface WalletBalance {
  pendingBalance: number;
  availableBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
}

/**
 * Wallet statistics
 */
export interface WalletStats {
  thisMonthEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
}

/**
 * Complete wallet data with balance and stats
 */
export interface WalletData {
  balance: WalletBalance;
  stats: WalletStats;
}

/**
 * Wallet transaction item for display
 */
export interface WalletTransactionItem {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

/**
 * Paginated wallet transactions response
 */
export interface WalletTransactionsResponse {
  transactions: WalletTransactionItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Payout request for display
 */
export interface PayoutRequest {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string | null;
  status: PayoutStatus;
  notes: string | null;
  transactionRef: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payout with vendor information (admin view)
 */
export interface PayoutWithVendor extends PayoutRequest {
  vendor: {
    id: string;
    businessName: string;
    businessEmail: string;
  };
  wallet: {
    pendingBalance: number;
    availableBalance: number;
  };
}

/**
 * Paginated payouts response
 */
export interface PayoutsResponse {
  payouts: PayoutRequest[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Admin payouts response with stats
 */
export interface AdminPayoutsResponse {
  payouts: PayoutWithVendor[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalPendingAmount: number;
  };
}

/**
 * Detailed payout information with vendor and transaction data
 */
export interface PayoutDetails {
  payout: PayoutRequest;
  vendor: {
    id: string;
    businessName: string;
    businessEmail: string;
    currentAvailableBalance: number;
    pendingBalance: number;
    commissionRate: number;
  };
  relatedTransactions: WalletTransactionItem[];
}

/**
 * Transaction type badge configuration
 */
export interface TransactionTypeBadge {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}

/**
 * Payout status badge configuration
 */
export interface PayoutStatusBadge {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}
