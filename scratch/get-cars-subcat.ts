import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const subcat = await prisma.adsSubCategory.findFirst({
    where: {
      slug: "cars",
    },
    include: {
      fieldDefinitions: true,
    },
  });
  console.log("CARS SUBCATEGORY FIELDS:");
  console.log(JSON.stringify(subcat, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
