import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@primewear.lk" },
    update: {},
    create: {
      email: "admin@primewear.lk",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      firstName: "System",
      lastName: "Admin",
      emailVerified: true,
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create some sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "mens-clothing" },
      update: {},
      create: {
        name: "Men's Clothing",
        slug: "mens-clothing",
        description: "Clothing for men",
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "womens-clothing" },
      update: {},
      create: {
        name: "Women's Clothing",
        slug: "womens-clothing",
        description: "Clothing for women",
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: {
        name: "Accessories",
        slug: "accessories",
        description: "Fashion accessories",
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "footwear" },
      update: {},
      create: {
        name: "Footwear",
        slug: "footwear",
        description: "Shoes and sandals",
        isActive: true,
        sortOrder: 4,
      },
    }),
  ]);

  console.log("✅ Categories created:", categories.length);

  // Create default system settings
  const settings = await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: "platform_commission" },
      update: {},
      create: {
        key: "platform_commission",
        value: { rate: 10, description: "Default platform commission percentage" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "order_cancel_hours" },
      update: {},
      create: {
        key: "order_cancel_hours",
        value: { hours: 24, description: "Hours within which order can be cancelled" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "return_request_hours" },
      update: {},
      create: {
        key: "return_request_hours",
        value: { hours: 24, description: "Hours after delivery within which return can be requested" },
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "payout_schedule" },
      update: {},
      create: {
        key: "payout_schedule",
        value: { frequency: "weekly", day: "monday", description: "Vendor payout schedule" },
      },
    }),
  ]);

  console.log("✅ System settings created:", settings.length);

  console.log("🎉 Database seed completed!");
  console.log("");
  console.log("📋 Admin Login Credentials:");
  console.log("   Email: admin@primewear.lk");
  console.log("   Password: admin123");
  console.log("");
  console.log("⚠️  Remember to change the admin password in production!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
