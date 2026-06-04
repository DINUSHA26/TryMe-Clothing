import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Fetching chat rooms...");
    const rooms = await prisma.chatRoom.findMany({
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        orderItem: {
          select: {
            id: true,
            productSnapshot: true,
            variantSnapshot: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            hasBlockedContent: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`Found ${rooms.length} rooms`);
    
    // Attempt formatting
    const formattedRooms = rooms.map((room) => {
      try {
        return {
          id: room.id,
          customer: {
            firstName: room.customer.user.firstName,
            lastName: room.customer.user.lastName,
            email: room.customer.user.email,
          },
          vendor: {
            businessName: room.vendor.businessName,
            email: room.vendor.user.email,
          },
          order: {
            orderNumber: room.orderItem.order.orderNumber,
            createdAt: room.orderItem.order.createdAt,
          },
          product: {
            name: (room.orderItem.productSnapshot as any)?.name || "Unknown Product",
            variant: room.orderItem.variantSnapshot,
          },
        };
      } catch (err: any) {
        console.error(`Error formatting room ${room.id}:`, err.message);
        throw err;
      }
    });

    console.log("Success! Formatted rooms count:", formattedRooms.length);
  } catch (error: any) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
