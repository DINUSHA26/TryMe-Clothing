const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { slug: 'clothing-hub' },
      include: {
        _count: {
          select: {
            products: true,
          }
        }
      }
    });
    
    console.log("Vendor details:", JSON.stringify(vendor, null, 2));

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isDisabledByAdmin: true,
      }
    });

    console.log("Products associated with vendor:", JSON.stringify(products, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
