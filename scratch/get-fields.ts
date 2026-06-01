import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.adsCategory.findMany({
    include: {
      subCategories: {
        include: {
          fieldDefinitions: true,
        },
      },
    },
  });
  console.log("ALL CLASSIFIED CATEGORIES, SUBCATEGORIES AND FIELDS:");
  console.log(JSON.stringify(categories, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
