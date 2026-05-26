import { PrismaClient, DisputeStatus } from '@prisma/client';
import { processDisputeRefund } from '../src/lib/utils/dispute';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  try {
    const orderNumber = 'PW-20260526-002';
    
    // 1. Fetch order and vendor details
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });
    
    if (!order) {
      console.error('Order PW-20260526-002 not found!');
      return;
    }
    
    const orderId = order.id;
    const customerId = order.customerId;
    const vendorId = order.items[0].vendorId;

    // Fetch the vendor's wallet
    const walletBefore = await prisma.wallet.findUnique({
      where: { vendorId }
    });
    
    if (!walletBefore) {
      console.error('Wallet not found for vendor:', vendorId);
      return;
    }

    console.log('--- BEFORE REFUND ---');
    console.log('Available Balance:', walletBefore.availableBalance.toString());
    console.log('Total Earnings:', walletBefore.totalEarnings.toString());

    // 2. Create a temporary dispute
    const tempDisputeId = 'temp_disp_' + Math.random().toString(36).substring(2, 11);
    console.log(`Creating temporary dispute ${tempDisputeId}...`);
    await prisma.dispute.create({
      data: {
        id: tempDisputeId,
        orderId,
        customerId,
        vendorId,
        reason: 'OTHER',
        description: 'Test dispute for commission retention logic',
        status: DisputeStatus.OPEN
      }
    });

    // 3. Call processDisputeRefund
    console.log('Executing processDisputeRefund...');
    await processDisputeRefund(orderId, tempDisputeId);

    // 4. Fetch the vendor's wallet after refund
    const walletAfter = await prisma.wallet.findUnique({
      where: { vendorId }
    });

    console.log('--- AFTER REFUND ---');
    console.log('Available Balance:', walletAfter.availableBalance.toString());
    console.log('Total Earnings:', walletAfter.totalEarnings.toString());

    // 5. Verify balances
    const balanceDiff = walletBefore.availableBalance.minus(walletAfter.availableBalance);
    const earningsDiff = walletBefore.totalEarnings.minus(walletAfter.totalEarnings);
    console.log('Available Balance Decrement:', balanceDiff.toString());
    console.log('Total Earnings Decrement:', earningsDiff.toString());

    // We expect gross refund of Rs. 5000.00
    const expectedGrossRefund = new Decimal(5000);
    const balancePass = balanceDiff.equals(expectedGrossRefund);
    const earningsPass = earningsDiff.equals(expectedGrossRefund);

    // 6. Fetch wallet transactions to inspect descriptions and types
    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: walletBefore.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('--- LATEST TRANSACTIONS ---');
    txs.forEach(t => {
      console.log(`Type: ${t.type}, Amount: ${t.amount.toString()}, Desc: ${t.description}`);
    });

    // Check if a COMMISSION reversal transaction exists for our temporary dispute
    const hasCommissionReversal = txs.some(t => 
      t.type === 'COMMISSION' && 
      t.amount.greaterThan(0) && 
      (t.description.includes(tempDisputeId.slice(0, 8)) || (t.metadata && (t.metadata as any).disputeId === tempDisputeId))
    );
    
    // Check if the REFUND transaction contains the handling fee retention note
    const refundTx = txs.find(t => t.type === 'REFUND');
    const hasRetentionNote = refundTx && refundTx.description.includes('Order Handling Fee of Rs. 500.00 retained by platform');

    console.log('--- VERIFICATION ---');
    if (balancePass) {
      console.log('✅ PASS: Available balance was debited by the full gross refund amount (5000).');
    } else {
      console.log('❌ FAIL: Available balance was not debited correctly.');
    }

    if (earningsPass) {
      console.log('✅ PASS: Total earnings were decremented by the full gross refund amount (5000).');
    } else {
      console.log('❌ FAIL: Total earnings were not decremented correctly.');
    }

    if (!hasCommissionReversal) {
      console.log('✅ PASS: No commission reversal (credit) transaction was created.');
    } else {
      console.log('❌ FAIL: Commission reversal transaction was incorrectly created.');
    }

    if (hasRetentionNote) {
      console.log('✅ PASS: Refund transaction description correctly shows handling fee retention.');
    } else {
      console.log('❌ FAIL: Refund transaction description is missing or incorrect.');
    }

    // 7. Cleanup
    console.log('Cleaning up temporary database changes...');
    await prisma.$transaction([
      // Restore wallet balances
      prisma.wallet.update({
        where: { id: walletBefore.id },
        data: {
          availableBalance: walletBefore.availableBalance,
          totalEarnings: walletBefore.totalEarnings
        }
      }),
      // Delete temporary dispute and transactions
      prisma.dispute.delete({ where: { id: tempDisputeId } }),
      prisma.walletTransaction.deleteMany({
        where: {
          walletId: walletBefore.id,
          metadata: {
            path: ['disputeId'],
            equals: tempDisputeId
          }
        }
      }),
      // Restore order & items back to DELIVERED
      prisma.$executeRawUnsafe('UPDATE "Order" SET "status" = \'DELIVERED\'::"OrderStatus" WHERE "id" = $1', orderId),
      prisma.$executeRawUnsafe('UPDATE "OrderItem" SET "status" = \'DELIVERED\'::"OrderStatus" WHERE "orderId" = $1', orderId),
      prisma.orderStatusHistory.deleteMany({
        where: { orderId, status: 'REFUNDED' }
      })
    ]);
    console.log('Cleanup finished successfully.');

  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
