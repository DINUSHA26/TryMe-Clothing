import { prisma } from '@/lib/prisma';
import {
  DisputeStatus,
  ResolutionType,
  DisputeEligibilityResult,
  DisputeRefundCalculation,
  DISPUTE_ELIGIBLE_ORDER_STATUSES,
  DISPUTE_WINDOW_DAYS,
} from '@/types/dispute';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Check if an order is eligible for dispute creation
 */
export async function checkDisputeEligibility(
  orderId: string,
  customerId: string,
  orderItemId?: string
): Promise<DisputeEligibilityResult> {
  // Fetch order with necessary details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      statusHistory: {
        where: {
          status: {
            in: ['DELIVERED', 'DELIVERY_CONFIRMED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) {
    return { eligible: false, reason: 'Order not found' };
  }

  // Fetch disputes using raw SQL to bypass out-of-sync Prisma client
  const disputes: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, status, "orderItemId" FROM "Dispute" WHERE "orderId" = $1 AND status != 'CLOSED'`,
    orderId
  );

  // Attach disputes to order for the rest of the logic
  (order as any).disputes = disputes;

  // Check if order belongs to customer
  if (order.customerId !== customerId) {
    return {
      eligible: false,
      reason: 'You do not have permission to dispute this order',
    };
  }

  // Check if order status allows disputes
  if (!DISPUTE_ELIGIBLE_ORDER_STATUSES.includes(order.status as any)) {
    return {
      eligible: false,
      reason: `Disputes can only be opened for delivered or returned orders. Current status: ${order.status}`,
    };
  }

  // Check if there's already an active dispute
  const activeDispute = (order as any).disputes.find(
    (d: any) =>
      (d.status === DisputeStatus.OPEN || d.status === DisputeStatus.IN_REVIEW) &&
      (!orderItemId || d.orderItemId === orderItemId)
  );
  if (activeDispute) {
    return {
      eligible: false,
      reason: 'An active dispute already exists for this order',
      existingDisputeId: activeDispute.id,
    };
  }

  // Check time window (24 hours after delivery)
  const deliveryDate = order.statusHistory[0]?.createdAt;
  if (deliveryDate) {
    const hoursSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDelivery > 24) {
      return {
        eligible: false,
        reason: 'Disputes must be opened within 24 hours of delivery confirmation',
      };
    }
  }

  return { eligible: true };
}

/**
 * Calculate refund amount for dispute resolution
 */
export async function calculateDisputeRefund(
  orderId: string,
  customRefundAmount?: number,
  disputeId?: string
): Promise<DisputeRefundCalculation> {
  if (disputeId) disputeId = disputeId.toLowerCase();
  // Fetch order with all necessary data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                  commissionRate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const orderTotal = order.totalAmount.toNumber();
  
  // If dispute is for specific item, default refund to item total
  let targetItem = null;
  if (disputeId) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { orderItemId: true }
    });
    if (dispute?.orderItemId) {
      targetItem = order.items.find(item => item.id === dispute.orderItemId);
    }
  }

  const refundAmount = customRefundAmount ?? (targetItem ? targetItem.totalPrice.toNumber() : orderTotal);

  // Calculate vendor refunds
  const vendorRefunds: Array<{
    vendorId: string;
    vendorName: string;
    amount: number;
    commissionReversed: number;
  }> = [];

  let totalCommission = 0;

  if (targetItem) {
    // Single item dispute: only affect the specific vendor
    const vendorId = targetItem.vendorId;
    const commissionRate = targetItem.product.vendor.commissionRate.toNumber();
    const commissionReversed = refundAmount * (commissionRate / 100);

    vendorRefunds.push({
      vendorId,
      vendorName: targetItem.product.vendor.businessName,
      amount: refundAmount,
      commissionReversed,
    });
    totalCommission = commissionReversed;
  } else {
    // Order-level dispute: proportional refund across all vendors
    // Group items by vendor
    const itemsByVendor = new Map<string, typeof order.items>();
    for (const item of order.items) {
      const vendorId = item.vendorId;
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, []);
      }
      itemsByVendor.get(vendorId)!.push(item);
    }

    for (const [vendorId, items] of itemsByVendor) {
      const vendorTotal = items.reduce(
        (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
        0
      );

      // Proportional refund
      const vendorRefundAmount = (vendorTotal / orderTotal) * refundAmount;

      // Get commission rate
      const commissionRate = items[0].product.vendor.commissionRate.toNumber();
      const commissionReversed = vendorRefundAmount * (commissionRate / 100);

      vendorRefunds.push({
        vendorId,
        vendorName: items[0].product.vendor.businessName,
        amount: vendorRefundAmount,
        commissionReversed,
      });

      totalCommission += commissionReversed;
    }
  }

  return {
    orderTotal,
    refundAmount,
    platformCommission: totalCommission,
    vendorRefunds,
  };
}

/**
 * Process dispute refund (reverse wallet transactions)
 * This is called when a dispute is resolved in customer's favor
 */
export async function processDisputeRefund(
  orderId: string,
  disputeId: string,
  customRefundAmount?: number
): Promise<void> {
  disputeId = disputeId.toLowerCase();
  const refundCalc = await calculateDisputeRefund(orderId, customRefundAmount, disputeId);

  await prisma.$transaction(async (tx) => {
    // Fetch dispute to check for orderItemId
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      select: { orderItemId: true }
    });

    // Process refund for each vendor (for item-level, this will only be one vendor)
    for (const vendorRefund of refundCalc.vendorRefunds) {
      const wallet = await tx.wallet.findUnique({
        where: { vendorId: vendorRefund.vendorId },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for vendor ${vendorRefund.vendorId}`);
      }

      const currentAvailableBalance = wallet.availableBalance;
      const vendorAmount = new Decimal(vendorRefund.amount);
      const commissionAmount = new Decimal(vendorRefund.commissionReversed);

      const newAvailableBalance = currentAvailableBalance.minus(vendorAmount);

      // Create REFUND transaction for the vendor (Gross)
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: vendorAmount.negated(),
          balanceBefore: currentAvailableBalance,
          balanceAfter: newAvailableBalance,
          description: `Refund for dispute #${disputeId.slice(0, 8)} - Order ${orderId.slice(0, 8)} (Order Handling Fee of Rs. ${commissionAmount.toFixed(2)} retained by platform)`,
          metadata: {
            disputeId,
            orderId,
            vendorId: vendorRefund.vendorId,
            handlingFeeRetained: commissionAmount.toNumber(),
          },
        },
      });

      // Update wallet: Deduct gross amount from available balance and decrement totalEarnings by gross amount
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: newAvailableBalance,
          totalEarnings: {
            decrement: vendorAmount,
          },
        },
      });
    }

    // Update item status if it's an item-level dispute (using raw SQL to bypass out-of-sync Prisma client runtime)
    if (dispute?.orderItemId) {
      await tx.$executeRawUnsafe(
        `UPDATE "OrderItem" SET "status" = 'REFUNDED', "refundStatus" = 'COMPLETED' WHERE "id" = $1`,
        dispute.orderItemId
      );

      // Check if all items are refunded/terminal to update order status
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
      });
      const allDone = allItems.every(item => 
        ["REFUNDED", "RETURNED", "CANCELLED"].includes(item.status) || 
        (item.status === "DELIVERED" && item.refundStatus === "NONE")
      );
      
      if (allDone) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED" },
        });
      }
    } else {
      // Order-level refund: update all items and order (using raw SQL)
      await tx.$executeRawUnsafe(
        `UPDATE "OrderItem" SET "status" = 'REFUNDED', "refundStatus" = 'COMPLETED' WHERE "orderId" = $1`,
        orderId
      );

      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });
    }

    // Create order status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "REFUNDED",
        note: `Refund processed for ${dispute?.orderItemId ? `item ${dispute.orderItemId}` : 'order'} due to dispute resolution (Dispute #${disputeId.slice(0, 8)})`,
      },
    });
  });
}

/**
 * Validate status transition for disputes
 */
export function validateDisputeStatusTransition(
  currentStatus: DisputeStatus,
  newStatus: DisputeStatus
): { valid: boolean; error?: string } {
  const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
    [DisputeStatus.OPEN]: [DisputeStatus.IN_REVIEW, DisputeStatus.CLOSED],
    [DisputeStatus.IN_REVIEW]: [
      DisputeStatus.RESOLVED_CUSTOMER_FAVOR,
      DisputeStatus.RESOLVED_VENDOR_FAVOR,
      DisputeStatus.CLOSED,
    ],
    [DisputeStatus.RESOLVED_CUSTOMER_FAVOR]: [], // Final state
    [DisputeStatus.RESOLVED_VENDOR_FAVOR]: [], // Final state
    [DisputeStatus.CLOSED]: [], // Final state
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
}

/**
 * Map resolution type to dispute status
 */
export function getDisputeStatusFromResolution(
  resolutionType: ResolutionType
): DisputeStatus {
  switch (resolutionType) {
    case ResolutionType.CUSTOMER_FAVOR:
      return DisputeStatus.RESOLVED_CUSTOMER_FAVOR;
    case ResolutionType.VENDOR_FAVOR:
      return DisputeStatus.RESOLVED_VENDOR_FAVOR;
    case ResolutionType.CLOSED_NO_ACTION:
      return DisputeStatus.CLOSED;
  }
}

/**
 * Check if a user can view a dispute
 */
export async function canViewDispute(
  disputeId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  disputeId = disputeId.toLowerCase();
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      customer: {
        select: { userId: true },
      },
      order: {
        include: {
          items: {
            select: { id: true, vendorId: true },
          },
        },
      },
    },
  });

  if (!dispute) return false;

  // Admin can view all disputes
  if (userRole === 'ADMIN') return true;

  // Customer can view their own disputes
  if (dispute.customer.userId === userId) return true;

  // Vendor can view disputes related to their orders
  if (userRole === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (vendor) {
      // 1. If dispute has a direct vendorId, check it
      if ((dispute as any).vendorId === vendor.id) return true;

      // 2. If dispute is for a specific item, check if that item belongs to this vendor
      if (dispute.orderItemId) {
        const item = dispute.order.items.find(i => i.id === dispute.orderItemId);
        return item?.vendorId === vendor.id;
      }

      // 3. Fallback: Check if any item in the order belongs to this vendor 
      // (This is for legacy order-level disputes)
      const hasVendorItems = dispute.order.items.some(
        (item) => item.vendorId === vendor.id
      );
      return hasVendorItems;
    }
  }

  return false;
}

/**
 * Check if a user can add comments to a dispute
 */
export function canAddDisputeComment(
  userRole: string,
  disputeStatus: DisputeStatus
): boolean {
  // Cannot add comments to resolved disputes
  if (
    disputeStatus === DisputeStatus.RESOLVED_CUSTOMER_FAVOR ||
    disputeStatus === DisputeStatus.RESOLVED_VENDOR_FAVOR ||
    disputeStatus === DisputeStatus.CLOSED
  ) {
    return false;
  }

  // Admin and customer can add comments
  return userRole === 'ADMIN' || userRole === 'CUSTOMER';
}

/**
 * Format dispute evidence for display
 */
export function formatDisputeEvidence(evidence: string[]): Array<{
  url: string;
  thumbnail: string;
  publicId: string;
}> {
  return evidence.map((url) => {
    // Extract Cloudinary public ID from URL
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    const publicId = matches ? matches[1] : '';

    return {
      url,
      thumbnail: url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
      publicId,
    };
  });
}

/**
 * Create an audit log entry for a dispute status change
 */
export async function createDisputeAuditLog(
  disputeId: string,
  oldStatus: DisputeStatus | null,
  newStatus: DisputeStatus,
  changedById: string,
  reason?: string
): Promise<void> {
  disputeId = disputeId.toLowerCase();
  try {
    await prisma.disputeAuditLog.create({
      data: {
        disputeId,
        oldStatus,
        newStatus,
        changedById,
        reason,
      },
    });
  } catch (error) {
    console.error(`[Dispute Audit Log] Failed to create audit log for dispute ${disputeId}:`, error);
  }
}

/**
 * Release escrow funds to vendor when dispute is resolved in vendor's favor
 */
export async function processDisputeReleaseToVendor(
  orderId: string,
  disputeId: string
): Promise<void> {
  disputeId = disputeId.toLowerCase();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                  commissionRate: true,
                },
              },
            },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Fetch dispute to see if it's item-level
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: { orderItemId: true, vendorId: true }
  });

  if (!dispute) {
    throw new Error('Dispute not found');
  }

  // Check if funds were already released (i.e. order was DELIVERY_CONFIRMED or COMPLETED before being disputed)
  const wasReleased = order.statusHistory.some(h => 
    h.status === 'DELIVERY_CONFIRMED' || h.status === 'COMPLETED'
  );

  await prisma.$transaction(async (tx) => {
    // If not already released, release the funds now
    if (!wasReleased) {
      // Find the vendor(s) involved
      const targetVendorId = dispute.vendorId;
      const targetItemId = dispute.orderItemId;

      // Group items by vendor
      const itemsToRelease = order.items.filter(item => 
        (!targetVendorId || item.vendorId === targetVendorId) &&
        (!targetItemId || item.id === targetItemId)
      );

      const vendorGroups = new Map<string, typeof order.items>();
      for (const item of itemsToRelease) {
        const vId = item.vendorId;
        if (!vendorGroups.has(vId)) {
          vendorGroups.set(vId, []);
        }
        vendorGroups.get(vId)!.push(item);
      }

      for (const [vId, items] of vendorGroups.entries()) {
        const wallet = await tx.wallet.findUnique({
          where: { vendorId: vId },
        });

        if (!wallet) {
          throw new Error(`Wallet not found for vendor ${vId}`);
        }

        // Calculate net amount to release: gross total minus commission
        let grossAmount = items.reduce((sum, item) => {
          return sum.add(item.totalPrice);
        }, new Decimal(0));

        const commissionRate = items[0].product.vendor.commissionRate;
        const commissionAmount = grossAmount.mul(commissionRate).div(100);
        const netAmount = grossAmount.sub(commissionAmount);

        const currentPendingBalance = wallet.pendingBalance;
        const currentAvailableBalance = wallet.availableBalance;

        // Ensure we don't release more than the current pending balance
        const releaseAmount = Decimal.min(currentPendingBalance, netAmount);

        if (releaseAmount.greaterThan(0)) {
          const newPendingBalance = currentPendingBalance.sub(releaseAmount);
          const newAvailableBalance = currentAvailableBalance.add(releaseAmount);

          // Create RELEASE transaction
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "RELEASE",
              amount: releaseAmount,
              balanceBefore: currentPendingBalance,
              balanceAfter: newPendingBalance,
              description: `Funds released via dispute resolution #${disputeId.slice(0, 8)}`,
              metadata: {
                disputeId,
                orderId,
                vendorId: vId,
                releaseAmount: releaseAmount.toNumber(),
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
        }
      }
    }

    // Update item and order statuses back to their resolved state
    const resolvedItemStatus = wasReleased ? 'COMPLETED' : 'DELIVERED';
    const resolvedOrderStatus = wasReleased ? 'COMPLETED' : 'DELIVERED';

    if (dispute.orderItemId) {
      await tx.$executeRawUnsafe(
        `UPDATE "OrderItem" SET "status" = $1::"OrderStatus", "refundStatus" = 'NONE'::"RefundStatus" WHERE "id" = $2`,
        resolvedItemStatus,
        dispute.orderItemId
      );

      // Check other items
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
      });
      const allDone = allItems.every(item => 
        ["REFUNDED", "RETURNED", "CANCELLED"].includes(item.status) || 
        (item.status === resolvedItemStatus && item.refundStatus === "NONE")
      );
      if (allDone) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: resolvedOrderStatus as any },
        });
      }
    } else {
      await tx.$executeRawUnsafe(
        `UPDATE "OrderItem" SET "status" = $1::"OrderStatus", "refundStatus" = 'NONE'::"RefundStatus" WHERE "orderId" = $2`,
        resolvedItemStatus,
        orderId
      );

      await tx.order.update({
        where: { id: orderId },
        data: { status: resolvedOrderStatus as any },
      });
    }

    // Add status history
    const historyId = `osh_${Math.random().toString(36).substring(2, 11)}`;
    await tx.$executeRawUnsafe(
      `INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt") VALUES ($1, $2, $3::"OrderStatus", $4, NOW())`,
      historyId,
      orderId,
      resolvedOrderStatus,
      `Dispute resolved in vendor favor. Status restored. (Dispute #${disputeId.slice(0, 8)})`
    );
  });
}

