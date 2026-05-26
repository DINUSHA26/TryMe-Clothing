import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmornexrp000q10bkspoh572h';
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
            dispute: {
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
    
    // Test the logic that might fail
    console.log('Testing toNumber() calls...');
    order.subtotal.toNumber();
    order.discountAmount.toNumber();
    order.shippingAmount.toNumber();
    order.totalAmount.toNumber();
    
    order.items.forEach(item => {
        item.unitPrice.toNumber();
        item.totalPrice.toNumber();
    });
    
    console.log('All tests passed!');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
