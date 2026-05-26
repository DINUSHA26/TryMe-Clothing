import { WalletTransactionType, PayoutStatus } from "@prisma/client";
import type { TransactionTypeBadge, PayoutStatusBadge } from "@/types/wallet";

/**
 * Mask account number to show only last 4 digits
 * @param accountNumber - Full account number
 * @returns Masked account number (e.g., "****7890")
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber;
  }
  const visibleDigits = accountNumber.slice(-4);
  return `****${visibleDigits}`;
}

/**
 * Format currency amount with Rs. symbol and comma separators
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "Rs. 1,234.56")
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format amount with sign (+ for positive, - for negative)
 * @param amount - Amount to format
 * @returns Formatted amount with sign
 */
export function formatAmountWithSign(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${formatCurrency(amount)}`;
}

/**
 * Get Sri Lankan banks list
 * @returns Array of Sri Lankan bank names
 */
export function getSriLankanBanks(): readonly string[] {
  return [
    "Bank of Ceylon",
    "People's Bank",
    "Commercial Bank of Ceylon",
    "Hatton National Bank",
    "Sampath Bank",
    "Nations Trust Bank",
    "Seylan Bank",
    "DFCC Bank",
    "Union Bank",
    "Pan Asia Banking Corporation",
    "National Development Bank",
    "Cargills Bank",
    "Standard Chartered Bank",
    "HSBC",
    "Citibank",
  ];
}

/**
 * Get transaction type badge configuration
 * @param type - Wallet transaction type
 * @returns Badge configuration with label, variant, and color
 */
export function getTransactionTypeBadge(
  type: WalletTransactionType
): TransactionTypeBadge {
  const badges: Record<WalletTransactionType, TransactionTypeBadge> = {
    HOLD: {
      label: "Hold",
      variant: "default",
      color: "blue",
    },
    COMMISSION: {
      label: "Commission",
      variant: "destructive",
      color: "red",
    },
    RELEASE: {
      label: "Release",
      variant: "default",
      color: "green",
    },
    REFUND: {
      label: "Refund",
      variant: "outline",
      color: "yellow",
    },
    PAYOUT: {
      label: "Payout",
      variant: "secondary",
      color: "purple",
    },
    CREDIT: {
      label: "Credit",
      variant: "default",
      color: "green",
    },
    DEBIT: {
      label: "Debit",
      variant: "destructive",
      color: "red",
    },
  };

  return badges[type];
}

/**
 * Get payout status badge configuration
 * @param status - Payout status
 * @returns Badge configuration with label, variant, and color
 */
export function getPayoutStatusBadge(status: PayoutStatus): PayoutStatusBadge {
  const badges: Record<PayoutStatus, PayoutStatusBadge> = {
    PENDING: {
      label: "Pending",
      variant: "outline",
      color: "yellow",
    },
    PROCESSING: {
      label: "Processing",
      variant: "default",
      color: "blue",
    },
    COMPLETED: {
      label: "Completed",
      variant: "default",
      color: "green",
    },
    FAILED: {
      label: "Failed",
      variant: "destructive",
      color: "red",
    },
  };

  return badges[status];
}

/**
 * Get transaction type label
 * @param type - Wallet transaction type
 * @returns Human-readable label
 */
export function getTransactionTypeLabel(type: WalletTransactionType): string {
  return getTransactionTypeBadge(type).label;
}

/**
 * Get payout status label
 * @param status - Payout status
 * @returns Human-readable label
 */
export function getPayoutStatusLabel(status: PayoutStatus): string {
  return getPayoutStatusBadge(status).label;
}

/**
 * Format short ID (first 6 and last 3 characters)
 * @param id - Full ID string
 * @returns Shortened ID (e.g., "abc123...xyz")
 */
export function formatShortId(id: string): string {
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 6)}...${id.slice(-3)}`;
}

/**
 * Check if transaction type should show positive amount (credit)
 * @param type - Wallet transaction type
 * @returns True if amount should be positive, false otherwise
 */
export function isTransactionCredit(type: WalletTransactionType): boolean {
  return type === "HOLD" || type === "RELEASE" || type === "CREDIT";
}

/**
 * Check if transaction type should show negative amount (debit)
 * @param type - Wallet transaction type
 * @returns True if amount should be negative, false otherwise
 */
export function isTransactionDebit(type: WalletTransactionType): boolean {
  return type === "COMMISSION" || type === "PAYOUT" || type === "REFUND" || type === "DEBIT";
}
