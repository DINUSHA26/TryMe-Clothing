import { PrismaClient } from '@prisma/client';
import { startOfMonth } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'kaludinu22@gmail.com';
    console.log(`Checking wallet and stats for: ${email}...`);

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
    const vendorId = user.vendor.id;

    // Simulate route.ts thisMonthEarnings calculation
    const monthStart = startOfMonth(new Date());
    const thisMonthTransactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        createdAt: {
          gte: monthStart,
        },
      },
    });

    let thisMonthEarnings = 0;
    for (const tx of thisMonthTransactions) {
      if (tx.type === "RELEASE") {
        thisMonthEarnings += tx.amount.toNumber();
      } else if (tx.type === "REFUND") {
        const amountNum = tx.amount.toNumber();
        if (amountNum < 0) {
          thisMonthEarnings += amountNum;
        }
      } else if (tx.type === "COMMISSION") {
        const metadata = tx.metadata as any;
        if (
          metadata &&
          (metadata.disputeId || tx.description.toLowerCase().includes("reversal"))
        ) {
          thisMonthEarnings += tx.amount.toNumber();
        }
      }
    }

    // Simulate route.ts overview report query
    const validStatuses = [
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "PARTIALLY_SHIPPED",
      "DELIVERY_CONFIRMED",
      "DELIVERED",
      "COMPLETED",
    ];

    const searchParamsRaw = [vendorId];
    let whereClause = `WHERE i."vendorId" = $1 AND o."status" IN (${validStatuses.map(s => `'${s}'::"OrderStatus"`).join(', ')})`;
    const salesResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COALESCE(SUM(i."totalPrice"), 0)::float as "totalSales",
        COUNT(*)::int as "totalOrders",
        COALESCE(AVG(i."totalPrice"), 0)::float as "averageOrderValue"
       FROM "OrderItem" i
       JOIN "Order" o ON i."orderId" = o."id"
       ${whereClause}`,
      ...searchParamsRaw
    );

    const { totalSales, totalOrders, averageOrderValue } = salesResult[0];

    console.log('--- WALLET ALIGNMENT ---');
    console.log('Available Balance (from wallet):', wallet.availableBalance.toString());
    console.log('Total Earnings (from wallet):   ', wallet.totalEarnings.toString());
    console.log('This Month Earnings (computed): ', thisMonthEarnings.toString());

    console.log('--- DASHBOARD SALES ALIGNMENT ---');
    console.log('Total Sales (computed):        ', totalSales);
    console.log('Total Orders (computed):       ', totalOrders);
    console.log('Average Order Value (computed):', averageOrderValue);

    const walletPass = 
      wallet.availableBalance.toString() === wallet.totalEarnings.toString() &&
      wallet.availableBalance.toString() === thisMonthEarnings.toString();

    console.log('--- RESULTS ---');
    if (walletPass) {
      console.log('✅ SUCCESS: Available Balance, Total Earnings, and Monthly Earnings are fully aligned!');
    } else {
      console.log('❌ FAILURE: Mismatch detected in wallet alignment.');
    }

    if (totalSales === 18000) {
      console.log('✅ SUCCESS: Dashboard data fetching issue is resolved (Total Sales is Rs. 18,000.00 for the completed orders).');
    } else {
      console.log(`❌ FAILURE: Expected Rs. 18,000.00 total sales, got ${totalSales}`);
    }

  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
