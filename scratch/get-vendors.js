const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getVendors() {
  try {
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        businessName: true,
        slug: true,
        status: true,
        isShopOpen: true,
      }
    });
    console.log(JSON.stringify(vendors, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

getVendors();
