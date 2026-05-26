const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { manualCompleteOrder } = require('./src/lib/utils/orderCompletion');

async function main() {
  try {
    const orderNumber = 'PW-20260526-002';
    
    // 1. Fetch order before complete
    const orderBefore = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });
    console.log('Order status before:', orderBefore.status);
    console.log('Items status before:', orderBefore.items.map(item => `${item.id}: ${item.status}`));

    // 2. Perform manual completion
    console.log('Executing manualCompleteOrder...');
    const result = await manualCompleteOrder(orderBefore.id, orderBefore.customerId);
    console.log('Completion result:', result);

    // 3. Fetch order after complete
    const orderAfter = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, statusHistory: true }
    });
    console.log('Order status after:', orderAfter.status);
    console.log('Items status after:', orderAfter.items.map(item => `${item.id}: ${item.status}`));
    console.log('Latest history note:', orderAfter.statusHistory[0]?.note);

    if (orderAfter.status === 'COMPLETED' && orderAfter.items.every(item => item.status === 'COMPLETED')) {
      console.log('✅ PASS: Order and all items transitioned to COMPLETED!');
    } else {
      console.log('❌ FAIL: Status transition not as expected.');
    }

    // 4. Restore status to DELIVERED so it can be tested/viewed normally in UI
    console.log('Restoring status back to DELIVERED for future runs/UI...');
    await prisma.$transaction([
      prisma.$executeRawUnsafe('UPDATE "Order" SET "status" = \'DELIVERED\'::"OrderStatus" WHERE "id" = $1', orderBefore.id),
      prisma.$executeRawUnsafe('UPDATE "OrderItem" SET "status" = \'DELIVERED\'::"OrderStatus" WHERE "orderId" = $1', orderBefore.id),
      prisma.orderStatusHistory.deleteMany({
        where: { orderId: orderBefore.id, status: 'COMPLETED' }
      })
    ]);
    console.log('Status successfully restored.');

  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
