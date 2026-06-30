import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryUpdates = [
  { slug: "mobiles", icon: "/images/categories/mobiles.png" },
  { slug: "electronics", icon: "/images/categories/electronics.png" },
  { slug: "vehicles", icon: "/images/categories/vehicles.png" },
  { slug: "property", icon: "/images/categories/property.png" },
  { slug: "home-garden", icon: "/images/categories/home_garden.png" },
  { slug: "animals", icon: "/images/categories/animals.png" },
  { slug: "services", icon: "/images/categories/services.png" },
  { slug: "business-industry", icon: "/images/categories/business_industry.png" },
  { slug: "hobby-sport-kids", icon: "/images/categories/hobby_sport.png" },
  { slug: "fashion-beauty", icon: "/images/categories/fashion_beauty.png" },
  { slug: "essentials", icon: "/images/categories/essentials.png" },
  { slug: "education", icon: "/images/categories/education.png" },
  { slug: "agriculture", icon: "/images/categories/agriculture.png" },
  { slug: "other", icon: "/images/categories/other.png" }
];

async function main() {
  console.log("Updating category icons in the database...");
  for (const update of categoryUpdates) {
    const category = await prisma.adsCategory.updateMany({
      where: { slug: update.slug },
      data: { icon: update.icon }
    });
    console.log(`Updated ${update.slug}: matched ${category.count} records`);
  }
  console.log("Category icons update complete.");
}

main()
  .catch((e) => {
    console.error("Error updating category icons:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
