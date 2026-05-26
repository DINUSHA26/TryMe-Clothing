const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orderItemId = 'cmpmm7zke0013yf0xuqld4z2a';
    const customerId = 'cmpmksb7b000mz4hlo5mm418r';
    const productId = 'cmpmm5jpk000uyf0x5s85mgtr';

    console.log('Clearing any existing reviews...');
    await prisma.productReview.deleteMany({
      where: { orderItemId }
    });

    console.log('Submitting review...');
    // We simulate the POST /api/reviews body
    const review = await prisma.productReview.upsert({
      where: { orderItemId },
      create: {
        productId,
        customerId,
        orderItemId,
        rating: 5,
        comment: 'Great product!',
      },
      update: {
        rating: 5,
        comment: 'Great product!',
      },
    });

    console.log('Review created successfully:', review);

    // Fetch the order to verify status is still DELIVERED
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'PW-20260526-002' }
    });

    console.log('Order status after review submission:', order.status);
    if (order.status === 'DELIVERED') {
      console.log('✅ PASS: Order status remains DELIVERED!');
    } else {
      console.log('❌ FAIL: Order status became ' + order.status);
    }

  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
