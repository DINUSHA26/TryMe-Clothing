/**
 * Chat Room Manager
 * Handles creation and management of chat rooms
 */

import { prisma } from '@/lib/prisma';
import { ChatRoom, OrderStatus } from '@prisma/client';

/**
 * Create chat rooms for an order (one per OrderItem)
 * IMPORTANT: Only creates rooms for PAYMENT_CONFIRMED orders
 *
 * @param orderId - Order ID
 * @returns Array of created chat rooms
 */
export async function createChatRoomsForOrder(orderId: string): Promise<ChatRoom[]> {
  try {
    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            // Check if chat room already exists
            chatRoom: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Verify order status is PAYMENT_CONFIRMED
    if (order.status !== OrderStatus.PAYMENT_CONFIRMED) {
      console.warn(
        `[Chat] Cannot create chat rooms for order ${order.orderNumber} - Status: ${order.status} (expected: PAYMENT_CONFIRMED)`
      );
      return [];
    }

    // Filter items that don't have chat rooms yet
    const itemsWithoutChatRooms = order.items.filter((item) => !item.chatRoom);

    if (itemsWithoutChatRooms.length === 0) {
      console.log(`[Chat] All chat rooms already exist for order ${order.orderNumber}`);
      return [];
    }

    console.log(
      `[Chat] Creating ${itemsWithoutChatRooms.length} chat room(s) for order ${order.orderNumber}`
    );

    // Create chat rooms in a transaction
    const chatRooms = await prisma.$transaction(
      itemsWithoutChatRooms.map((item) =>
        prisma.chatRoom.create({
          data: {
            orderItemId: item.id,
            customerId: order.customerId,
            vendorId: item.vendorId,
            isActive: true,
          },
          include: {
            customer: {
              select: {
                id: true,
                userId: true,
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
                userId: true,
                businessName: true,
              },
            },
            orderItem: {
              select: {
                id: true,
                productSnapshot: true,
                variantSnapshot: true,
              },
            },
          },
        })
      )
    );

    console.log(`[Chat] Created ${chatRooms.length} chat room(s) for order ${order.orderNumber}`);

    return chatRooms;
  } catch (error) {
    console.error(`[Chat] Error creating chat rooms for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get chat room by ID with full details
 *
 * @param roomId - Chat room ID
 * @returns Chat room with participants and order item
 */
export async function getChatRoomById(roomId: string) {
  return prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      customer: {
        select: {
          id: true,
          userId: true,
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
          userId: true,
          businessName: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
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
            },
          },
        },
      },
    },
  });
}

/**
 * Get chat room by order item ID
 *
 * @param orderItemId - Order item ID
 * @returns Chat room or null
 */
export async function getChatRoomByOrderItemId(orderItemId: string) {
  return prisma.chatRoom.findUnique({
    where: { orderItemId },
    include: {
      customer: {
        select: {
          id: true,
          userId: true,
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
          userId: true,
          businessName: true,
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
            },
          },
        },
      },
    },
  });
}

/**
 * Flag chat room for admin review
 *
 * @param roomId - Chat room ID
 * @param reason - Reason for flagging
 */
export async function flagChatRoom(roomId: string, reason: string) {
  // Note: We don't have a specific "flagged" field in the schema
  // We'll use hasBlockedContent from messages as the flag
  // This function is a placeholder for future enhancement
  console.log(`[Chat] Flagged room ${roomId}: ${reason}`);

  // You could add a comment or note to the room if needed
  // For now, rooms with blocked content are automatically flagged
  return true;
}
