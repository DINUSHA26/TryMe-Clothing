import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const disputes = await prisma.dispute.findMany({
    include: {
      order: true,
      customer: {
        include: {
          user: true
        }
      }
    }
  });
  console.log("ALL DISPUTES:", JSON.stringify(disputes, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
