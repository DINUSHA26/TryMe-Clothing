const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const o = await prisma.order.findUnique({ where: { orderNumber: 'PW-20260711-003' } });
  if (o) {
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: o.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(history, null, 2));
  } else {
    console.log('Order not found');
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
