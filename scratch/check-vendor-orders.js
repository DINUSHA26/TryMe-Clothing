const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'kaludinu22@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true }
  });

  if (!user || !user.vendor) {
    console.error('Vendor not found');
    return;
  }

  const vendorId = user.vendor.id;
  console.log(`Vendor ID: ${vendorId}`);

  const orderItems = await prisma.orderItem.findMany({
    where: { vendorId },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
          createdAt: true
        }
      }
    }
  });

  console.log('--- Vendor Order Items ---');
  orderItems.forEach(item => {
    console.log(`Order: ${item.order.orderNumber}, Order Status: ${item.order.status}, Item Status: ${item.status}, Price: ${item.totalPrice}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
