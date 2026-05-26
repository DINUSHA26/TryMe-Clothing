import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const disputeId = "disp_hi6gp60ts3a";
    console.log("1. Querying dispute details for ID:", disputeId);
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
            payment: {
              select: {
                amount: true,
                paymentMethod: true,
                paidAt: true,
                status: true,
              },
            },
            statusHistory: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                createdAt: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    console.log("DISPUTE LOADED SUCCESS:", !!dispute);

    if (!dispute) {
      console.log("No dispute found in DB.");
      return;
    }

    console.log("2. Querying chat history...");
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        orderItem: {
          orderId: dispute.orderId,
        },
      },
      include: {
        orderItem: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
    console.log("CHAT ROOMS LOADED SUCCESS. COUNT:", chatRooms.length);
  } catch (error) {
    console.error("DB QUERY ERROR:", error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
