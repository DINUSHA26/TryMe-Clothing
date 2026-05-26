import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmos3m2f90008xbt06h1usp5f';
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
            chatRoom: {
              select: { id: true },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
            paymentSlipUrl: true,
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('Order found:', order.id);
    console.log('All tests passed!');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
