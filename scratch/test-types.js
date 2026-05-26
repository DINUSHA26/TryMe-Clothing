const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const results = await prisma.$queryRawUnsafe(
    'SELECT "deliveryConfirmedAt", "createdAt" FROM "Order" WHERE "orderNumber" = $1',
    'PW-20260526-002'
  );
  const row = results[0];
  console.log('deliveryConfirmedAt:', row.deliveryConfirmedAt, 'type:', typeof row.deliveryConfirmedAt, 'isDate:', row.deliveryConfirmedAt instanceof Date);
  console.log('createdAt:', row.createdAt, 'type:', typeof row.createdAt, 'isDate:', row.createdAt instanceof Date);
}

main().catch(console.error).finally(() => prisma.$disconnect());
