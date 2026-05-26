import { Prisma } from '@prisma/client';

async function main() {
  console.log('OrderItem fields:', Object.keys(Prisma.OrderItemScalarFieldEnum));
}

main();
