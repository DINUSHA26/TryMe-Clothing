/**
 * Chat Access Control
 * Verifies user permissions to access chat rooms
 */

import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getChatRoomById } from './roomManager';

/**
 * Verify user has access to a chat room
 * Access rules:
 * - ADMIN: Can view all rooms (read-only)
 * - CUSTOMER: Can access rooms where they are the customer
 * - VENDOR: Can access rooms where they are the vendor
 *
 * @param roomId - Chat room ID
 * @param userId - User ID (from JWT)
 * @param role - User role (from JWT)
 * @returns Chat room if authorized
 * @throws Error if unauthorized or room not found
 */
export async function verifyRoomAccess(roomId: string, userId: string, role: UserRole) {
  // Get room with full details
  const room = await getChatRoomById(roomId);

  if (!room) {
    throw new Error('Chat room not found');
  }

  // Admin can access all rooms (read-only)
  if (role === UserRole.ADMIN) {
    return room;
  }

  // Customer can only access their own orders
  if (role === UserRole.CUSTOMER) {
    if (room.customer.userId === userId) {
      return room;
    }
    throw new Error('Access denied: You do not have permission to access this chat room');
  }

  // Vendor or Ads Seller can only access rooms for their items
  if (role === UserRole.VENDOR || (role as string) === 'ADS_SELLER') {
    if (room.vendor.userId === userId || room.customer.userId === userId) {
      return room;
    }
    throw new Error('Access denied: You do not have permission to access this chat room');
  }

  throw new Error('Invalid user role');
}

/**
 * Get all chat rooms for a user based on their role
 *
 * @param userId - User ID
 * @param role - User role
 * @returns Array of chat rooms
 */
export async function getUserChatRooms(userId: string, role: UserRole) {
  const commonInclude = {
    customer: {
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    },
    vendor: {
      select: {
        id: true,
        userId: true,
        businessName: true,
        logo: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
            status: true,
            createdAt: true,
          },
        },
      },
    },
    messages: {
      orderBy: { createdAt: 'desc' as const },
      take: 1, // Get last message for preview
    },
  };

  // Admin can see all rooms
  if (role === UserRole.ADMIN) {
    return prisma.chatRoom.findMany({
      include: commonInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Customer: Get rooms where they are the customer
  if (role === UserRole.CUSTOMER) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return [];
    }

    return prisma.chatRoom.findMany({
      where: { customerId: customer.id },
      include: commonInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Vendor: Get rooms where they are the vendor
  if (role === UserRole.VENDOR) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      return [];
    }

    return prisma.chatRoom.findMany({
      where: { vendorId: vendor.id },
      include: commonInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Ads Seller: Check if also has vendor or customer records
  if (role === UserRole.ADS_SELLER || (role as string) === 'ADS_SELLER') {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (vendor) {
      return prisma.chatRoom.findMany({
        where: { vendorId: vendor.id },
        include: commonInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (customer) {
      return prisma.chatRoom.findMany({
        where: { customerId: customer.id },
        include: commonInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }

    return [];
  }

  throw new Error('Invalid user role');
}

/**
 * Check if user can send messages in a room
 * Admin: Cannot send (read-only)
 * Customer & Vendor: Can send if they have access
 *
 * @param roomId - Chat room ID
 * @param userId - User ID
 * @param role - User role
 * @returns True if user can send messages
 */
export async function canSendMessage(roomId: string, userId: string, role: UserRole): Promise<boolean> {
  // Admin can send messages (oversight and support)
  if (role === UserRole.ADMIN) {
    return true;
  }

  // For customer, vendor, and ads seller, verify they have access
  try {
    await verifyRoomAccess(roomId, userId, role);
    return true;
  } catch (error) {
    return false;
  }
}
