import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetOrders() {
  console.log("=========================================");
  console.log("Starting Production Order Reset Process...");
  console.log("=========================================");

  try {
    // 1. Delete Dispute Audit Logs & Comments & Disputes
    const deletedDisputeLogs = await prisma.disputeAuditLog.deleteMany({});
    console.log(`Deleted ${deletedDisputeLogs.count} dispute audit logs.`);

    const deletedDisputeComments = await prisma.disputeComment.deleteMany({});
    console.log(`Deleted ${deletedDisputeComments.count} dispute comments.`);

    const deletedDisputes = await prisma.dispute.deleteMany({});
    console.log(`Deleted ${deletedDisputes.count} disputes.`);

    // 2. Delete Chat Messages & Chat Rooms
    const deletedChatMessages = await prisma.chatMessage.deleteMany({});
    console.log(`Deleted ${deletedChatMessages.count} chat messages.`);

    const deletedChatRooms = await prisma.chatRoom.deleteMany({});
    console.log(`Deleted ${deletedChatRooms.count} chat rooms.`);

    // 3. Delete Wallet Transactions
    const deletedWalletTxns = await prisma.walletTransaction.deleteMany({});
    console.log(`Deleted ${deletedWalletTxns.count} wallet transactions.`);

    // 4. Delete Payments
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} payment records.`);

    // 5. Delete Order Status History
    const deletedStatusHistory = await prisma.orderStatusHistory.deleteMany({});
    console.log(`Deleted ${deletedStatusHistory.count} order status history records.`);

    // 6. Delete Product Reviews
    const deletedReviews = await prisma.productReview.deleteMany({});
    console.log(`Deleted ${deletedReviews.count} product reviews.`);

    // 7. Delete Coupon Usages & reset Coupon counts
    const deletedCouponUsages = await prisma.couponUsage.deleteMany({});
    console.log(`Deleted ${deletedCouponUsages.count} coupon usage records.`);
    await prisma.coupon.updateMany({
      data: { usageCount: 0 },
    });
    console.log(`Reset all coupon usage counts to 0.`);

    // 8. Delete Order Items
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${deletedOrderItems.count} order items.`);

    // 9. Delete Orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} orders.`);

    // 10. Reset all Vendor Wallets
    const resetWallets = await prisma.wallet.updateMany({
      data: {
        pendingBalance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
      },
    });
    console.log(`Reset ${resetWallets.count} vendor wallets to 0 balance.`);

    console.log("=========================================");
    console.log("ORDER RESET COMPLETED SUCCESSFULLY!");
    console.log("The platform is now 100% clean for live deployment!");
    console.log("=========================================");
  } catch (error) {
    console.error("Error during order reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOrders();
