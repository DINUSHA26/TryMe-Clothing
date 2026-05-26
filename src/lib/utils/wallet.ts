/**
 * Wallet utility functions
 * Handles vendor earnings calculations and wallet crediting with commission deduction
 */

import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Vendor earnings breakdown
 */
export interface VendorEarnings {
  vendorId: string;
  vendorName: string;
  totalAmount: Decimal; // Sum of all order items for this vendor
  commissionRate: Decimal; // Commission rate (e.g., 10.00 for 10%)
  commissionAmount: Decimal; // Calculated commission
  netAmount: Decimal; // Amount after commission deduction
  orderItemIds: string[]; // Order item IDs for this vendor
}

/**
 * Calculate vendor earnings from order items
 * Groups items by vendor and calculates commission per vendor
 *
 * @param orderItems - Order items with vendor info
 * @returns Array of vendor earnings
 */
export function calculateVendorEarnings(
  orderItems: Array<{
    id: string;
    vendorId: string;
    totalPrice: Decimal;
    vendor: {
      id: string;
      businessName: string;
      commissionRate: Decimal;
    };
  }>,
  discountAmount?: Decimal,
  couponVendorId?: string | null
): VendorEarnings[] {
  // Group items by vendor
  const vendorGroups = new Map<
    string,
    {
      vendorId: string;
      vendorName: string;
      commissionRate: Decimal;
      items: Array<{ id: string; totalPrice: Decimal }>;
    }
  >();

  for (const item of orderItems) {
    const vendorId = item.vendorId;

    if (!vendorGroups.has(vendorId)) {
      vendorGroups.set(vendorId, {
        vendorId: item.vendor.id,
        vendorName: item.vendor.businessName,
        commissionRate: item.vendor.commissionRate,
        items: [],
      });
    }

    vendorGroups.get(vendorId)!.items.push({
      id: item.id,
      totalPrice: item.totalPrice,
    });
  }

  // Calculate earnings for each vendor
  const vendorEarnings: VendorEarnings[] = [];

  for (const group of vendorGroups.values()) {
    // Calculate total amount for this vendor (totalPrice already includes quantity)
    let totalAmount = group.items.reduce((sum, item) => {
      return sum.add(item.totalPrice);
    }, new Decimal(0));

    // If this vendor is the coupon's vendor, deduct discountAmount
    if (couponVendorId === group.vendorId && discountAmount) {
      totalAmount = totalAmount.sub(discountAmount);
    }

    // Calculate commission amount
    const commissionAmount = totalAmount.mul(group.commissionRate).div(100);

    // Calculate net amount (after commission deduction)
    const netAmount = totalAmount.sub(commissionAmount);

    vendorEarnings.push({
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      totalAmount,
      commissionRate: group.commissionRate,
      commissionAmount,
      netAmount,
      orderItemIds: group.items.map((item) => item.id),
    });
  }

  return vendorEarnings;
}

/**
 * Credit vendor wallets with HOLD and COMMISSION transactions
 * This function performs atomic wallet operations:
 * 1. HOLD transaction - Add total amount to pendingBalance
 * 2. COMMISSION transaction - Deduct commission from pendingBalance
 *
 * @param vendorEarnings - Array of vendor earnings
 * @param orderId - Order ID
 * @param orderNumber - Order number (e.g., PW-20260204-001)
 * @param tx - Prisma transaction client
 */
export async function creditVendorWallets(
  vendorEarnings: VendorEarnings[],
  orderId: string,
  orderNumber: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  for (const earning of vendorEarnings) {
    // Fetch current wallet
    const wallet = await tx.wallet.findUnique({
      where: { vendorId: earning.vendorId },
    });

    if (!wallet) {
      throw new Error(`Wallet not found for vendor ${earning.vendorId}`);
    }

    // Current balances
    const currentPendingBalance = wallet.pendingBalance;

    // Step 1: Create HOLD transaction (add to pendingBalance)
    const balanceAfterHold = currentPendingBalance.add(earning.totalAmount);

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "HOLD",
        amount: earning.totalAmount,
        balanceBefore: currentPendingBalance,
        balanceAfter: balanceAfterHold,
        description: `Payment held for order ${orderNumber}`,
        metadata: {
          orderId,
          orderNumber,
          vendorId: earning.vendorId,
          vendorName: earning.vendorName,
          itemCount: earning.orderItemIds.length,
        },
      },
    });

    // Update wallet: Increment pendingBalance
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: balanceAfterHold,
      },
    });

    // Step 2: Create COMMISSION transaction (deduct from pendingBalance)
    const balanceAfterCommission = balanceAfterHold.sub(earning.commissionAmount);

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COMMISSION",
        amount: earning.commissionAmount,
        balanceBefore: balanceAfterHold,
        balanceAfter: balanceAfterCommission,
        description: `Platform commission (${earning.commissionRate.toFixed(2)}%) for order ${orderNumber}`,
        metadata: {
          orderId,
          orderNumber,
          vendorId: earning.vendorId,
          vendorName: earning.vendorName,
          commissionRate: earning.commissionRate.toNumber(),
          totalAmount: earning.totalAmount.toNumber(),
          commissionAmount: earning.commissionAmount.toNumber(),
          netAmount: earning.netAmount.toNumber(),
        },
      },
    });

    // Update wallet: Deduct commission from pendingBalance, add to totalEarnings
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: balanceAfterCommission,
        totalEarnings: { increment: earning.netAmount },
      },
    });

    // Log for audit trail
    console.log(`[Wallet] Credited vendor ${earning.vendorName} (${earning.vendorId}):`, {
      totalAmount: earning.totalAmount.toFixed(2),
      commissionRate: earning.commissionRate.toFixed(2) + "%",
      commissionAmount: earning.commissionAmount.toFixed(2),
      netAmount: earning.netAmount.toFixed(2),
      pendingBalance: balanceAfterCommission.toFixed(2),
    });
  }
}

/**
 * Format Decimal to number for JSON serialization
 */
export function decimalToNumber(decimal: Decimal): number {
  return decimal.toNumber();
}

/**
 * Calculate platform's total commission from vendor earnings
 */
export function calculatePlatformCommission(
  vendorEarnings: VendorEarnings[]
): Decimal {
  return vendorEarnings.reduce(
    (sum, earning) => sum.add(earning.commissionAmount),
    new Decimal(0)
  );
}

/**
 * Release vendor funds from pending to available balance
 * Called when customer confirms delivery
 * Moves funds from pendingBalance to availableBalance (RELEASE transaction)
 *
 * @param orderId - Order ID
 * @param orderNumber - Order number (e.g., PW-20260204-001)
 * @param tx - Prisma transaction client
 */
export async function releaseVendorFunds(
  orderId: string,
  orderNumber: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  // 1. Fetch order with items and vendor wallets
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      coupon: {
        select: { vendorId: true },
      },
      items: {
        include: {
          vendor: {
            include: { wallet: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // 2. Group items by vendor
  const vendorGroups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const vendorId = item.vendorId;
    if (!vendorGroups.has(vendorId)) {
      vendorGroups.set(vendorId, []);
    }
    vendorGroups.get(vendorId)!.push(item);
  }

  // 3. For each vendor, release funds
  for (const [vendorId, items] of vendorGroups.entries()) {
    const wallet = items[0].vendor.wallet;
    if (!wallet) {
      throw new Error(`Wallet not found for vendor ${vendorId}`);
    }

    // Calculate net amount: gross total minus commission (matching creditVendorWallets logic)
    let grossAmount = items.reduce((sum, item) => {
      return sum.add(item.totalPrice);
    }, new Decimal(0));

    // If this vendor is the coupon's vendor, deduct discountAmount
    if (order.coupon?.vendorId === vendorId) {
      grossAmount = grossAmount.sub(order.discountAmount);
    }

    const commissionRate = items[0].vendor.commissionRate;
    const commissionAmount = grossAmount.mul(commissionRate).div(100);
    const netAmount = grossAmount.sub(commissionAmount);

    const currentPendingBalance = wallet.pendingBalance;
    const currentAvailableBalance = wallet.availableBalance;

    // Verify sufficient pending balance
    if (currentPendingBalance.lessThan(netAmount)) {
      throw new Error(
        `Insufficient pending balance for vendor ${vendorId}. ` +
        `Pending: ${currentPendingBalance.toFixed(2)}, Required: ${netAmount.toFixed(2)}`
      );
    }

    // Calculate new balances
    const newPendingBalance = currentPendingBalance.sub(netAmount);
    const newAvailableBalance = currentAvailableBalance.add(netAmount);

    // Create RELEASE transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "RELEASE",
        amount: netAmount,
        balanceBefore: currentPendingBalance,
        balanceAfter: newPendingBalance,
        description: `Funds released for order ${orderNumber} (delivery confirmed)`,
        metadata: {
          orderId,
          orderNumber,
          vendorId,
          orderItemIds: items.map((i) => i.id),
          deliveryConfirmedAt: new Date().toISOString(),
          releaseAmount: netAmount.toNumber(),
        },
      },
    });

    // Update wallet balances
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: newPendingBalance,
        availableBalance: newAvailableBalance,
      },
    });

    // Log for audit trail
    console.log(`[Wallet] Released funds for vendor ${vendorId}:`, {
      netAmount: netAmount.toFixed(2),
      pendingBalance: newPendingBalance.toFixed(2),
      availableBalance: newAvailableBalance.toFixed(2),
    });
  }
}

/**
 * Refund order and reverse vendor wallet transactions
 * Called when order is cancelled after payment
 * Reverses HOLD and COMMISSION transactions, deducts from pendingBalance
 *
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param reason - Refund reason
 * @param tx - Prisma transaction client
 */
export async function refundOrder(
  orderId: string,
  orderNumber: string,
  reason: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  // Fetch order with items and wallet transactions
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          vendor: { include: { wallet: true } },
          walletTransactions: {
            where: { type: { in: ["HOLD", "COMMISSION"] } },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Group items by vendor
  const vendorGroups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    if (!vendorGroups.has(item.vendorId)) {
      vendorGroups.set(item.vendorId, []);
    }
    vendorGroups.get(item.vendorId)!.push(item);
  }

  // Process refund for each vendor
  for (const [vendorId, items] of vendorGroups.entries()) {
    const wallet = items[0].vendor.wallet;
    if (!wallet) {
      console.warn(`[Wallet] Wallet not found for vendor ${vendorId}, skipping refund`);
      continue;
    }

    // Calculate amounts to refund
    // HOLD transactions added funds to pendingBalance
    // COMMISSION transactions deducted from pendingBalance
    // Net amount in pending = HOLD - COMMISSION
    // We need to reverse this net amount
    const holdAmount = items.reduce((sum, item) => {
      const holdTx = item.walletTransactions.find((t) => t.type === "HOLD");
      return holdTx ? sum.add(holdTx.amount) : sum;
    }, new Decimal(0));

    const commissionAmount = items.reduce((sum, item) => {
      const commTx = item.walletTransactions.find((t) => t.type === "COMMISSION");
      return commTx ? sum.add(commTx.amount) : sum;
    }, new Decimal(0));

    // Net amount to deduct from pending balance
    const netAmount = holdAmount.sub(commissionAmount);

    if (netAmount.isZero()) {
      console.warn(`[Wallet] No funds to refund for vendor ${vendorId}`);
      continue;
    }

    const currentPendingBalance = wallet.pendingBalance;

    // Verify sufficient pending balance for refund
    if (currentPendingBalance.lessThan(netAmount)) {
      console.error(
        `[Wallet] Insufficient pending balance for refund. Vendor: ${vendorId}, ` +
        `Pending: ${currentPendingBalance.toFixed(2)}, Required: ${netAmount.toFixed(2)}`
      );
      // Continue with refund anyway but log the issue
    }

    const newPendingBalance = currentPendingBalance.sub(netAmount);

    // Create REFUND transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: netAmount,
        balanceBefore: currentPendingBalance,
        balanceAfter: newPendingBalance,
        description: `Refund for order ${orderNumber}: ${reason}`,
        metadata: {
          orderId,
          orderNumber,
          vendorId,
          reason,
          holdAmount: holdAmount.toNumber(),
          commissionAmount: commissionAmount.toNumber(),
          netAmount: netAmount.toNumber(),
        },
      },
    });

    // Update wallet: Deduct from pending balance and reverse totalEarnings
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: newPendingBalance,
        totalEarnings: { decrement: netAmount },
      },
    });

    // Log for audit trail
    console.log(`[Wallet] Refunded order for vendor ${vendorId}:`, {
      holdAmount: holdAmount.toFixed(2),
      commissionAmount: commissionAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      newPendingBalance: newPendingBalance.toFixed(2),
    });
  }

  // TODO: In Phase 11, integrate with PayHere refund API to refund customer
  console.log(`[Wallet] Refund completed for order ${orderNumber}. PayHere refund API integration pending (Phase 11).`);
}
