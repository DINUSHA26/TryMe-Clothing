import { PrismaClient } from '@prisma/client';
import { startOfMonth } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'kaludinu22@gmail.com';
    console.log(`Inspecting wallet for user: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!user || !user.vendor || !user.vendor.wallet) {
      console.error('Vendor or wallet not found!');
      return;
    }

    const wallet = user.vendor.wallet;
    console.log('--- WALLET RECORD ---');
    console.log('ID:', wallet.id);
    console.log('Available Balance:', wallet.availableBalance.toString());
    console.log('Pending Balance:', wallet.pendingBalance.toString());
    console.log('Total Earnings:', wallet.totalEarnings.toString());
    console.log('Total Withdrawn:', wallet.totalWithdrawn.toString());

    // Sum of RELEASE transactions this month
    const monthStart = startOfMonth(new Date());
    const releaseSum = await prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: 'RELEASE',
        createdAt: { gte: monthStart }
      },
      _sum: { amount: true }
    });

    console.log('RELEASE Transactions Sum this month:', releaseSum._sum.amount?.toString() || '0');

    // Fetch all transactions
    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`--- TRANSACTIONS (Total: ${txs.length}) ---`);
    txs.forEach(t => {
      console.log(`[${t.createdAt.toISOString()}] Type: ${t.type}, Amount: ${t.amount.toString()}, Before: ${t.balanceBefore.toString()}, After: ${t.balanceAfter.toString()}, Desc: ${t.description}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
