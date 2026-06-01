import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const fields = await prisma.adFieldDefinition.findMany({
    where: {
      OR: [
        { fieldKey: { contains: "model", mode: "insensitive" } },
        { label: { contains: "model", mode: "insensitive" } },
        { fieldKey: { contains: "brand", mode: "insensitive" } },
        { label: { contains: "brand", mode: "insensitive" } },
      ],
    },
    include: {
      subCategory: true,
    },
  });
  console.log("FIELDS MATCHING BRAND OR MODEL:");
  console.log(JSON.stringify(fields, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
