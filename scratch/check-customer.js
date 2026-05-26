const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findUnique({
    where: { id: 'cmpmksb7b000mz4hlo5mm418r' },
    include: { user: true }
  });
  console.log(JSON.stringify(customer, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
