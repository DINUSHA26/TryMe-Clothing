const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const w = await prisma.wallet.findUnique({ where: { vendorId: 'cmnm34ltn000qe2c62ae4tqjn' } });
  console.log(w);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
