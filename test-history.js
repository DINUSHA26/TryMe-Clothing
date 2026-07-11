const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const history = await prisma.orderStatusHistory.findMany({
    where: { orderId: 'cmrfsbaa600044gmjhwf1z2d8' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(history, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
