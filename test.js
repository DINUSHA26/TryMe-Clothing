const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      isActive: true,
      isDisabledByAdmin: true,
      vendor: {
        select: {
          status: true,
          user: {
            select: {
              isActive: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
