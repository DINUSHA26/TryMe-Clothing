import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderCount = await prisma.order.count();
  console.log('Total orders:', orderCount);
  if (orderCount > 0) {
    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log('Last order ID:', lastOrder?.id);
  }
  await prisma.$disconnect();
}

main();
