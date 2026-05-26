/**
 * Script to check wallets, transactions, and disputes
 * Run: node scratch/inspect-wallets.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  try {
    console.log('\n📊 Checking Wallets...\n');

    const wallets = await prisma.wallet.findMany({
      include: {
        vendor: {
          select: {
            businessName: true,
          },
        },
      },
    });

    for (const w of wallets) {
      console.log(`Vendor: ${w.vendor.businessName} (ID: ${w.vendorId})`);
      console.log(`Wallet ID: ${w.id}`);
      console.log(`Pending Balance: Rs. ${w.pendingBalance}`);
      console.log(`Available Balance: Rs. ${w.availableBalance}`);
      console.log(`Total Earnings: Rs. ${w.totalEarnings}`);
      console.log(`Total Withdrawn: Rs. ${w.totalWithdrawn}`);
      console.log('─'.repeat(40));
    }

    console.log('\n📊 Checking Disputes...\n');
    const disputes = await prisma.dispute.findMany({
      include: {
        order: {
          select: {
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    for (const d of disputes) {
      console.log(`Dispute ID: ${d.id}`);
      console.log(`Status: ${d.status}`);
      console.log(`Order ID: ${d.orderId}`);
      console.log(`Order Status: ${d.order.status}`);
      console.log(`Order Total: Rs. ${d.order.totalAmount}`);
      console.log(`OrderItem ID: ${d.orderItemId}`);
      console.log('─'.repeat(40));
    }

    console.log('\n📊 Checking Recent Wallet Transactions...\n');
    const transactions = await prisma.walletTransaction.findMany({
      take: 15,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        wallet: {
          include: {
            vendor: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    for (const t of transactions) {
      console.log(`Date: ${t.createdAt.toISOString()}`);
      console.log(`Vendor: ${t.wallet.vendor.businessName}`);
      console.log(`Type: ${t.type}`);
      console.log(`Amount: ${t.amount}`);
      console.log(`Balance Before: ${t.balanceBefore}`);
      console.log(`Balance After: ${t.balanceAfter}`);
      console.log(`Description: ${t.description}`);
      console.log(`Metadata: ${JSON.stringify(t.metadata)}`);
      console.log('─'.repeat(40));
    }

  } catch (error) {
    console.error('❌ Error inspecting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
