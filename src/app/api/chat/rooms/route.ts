/**
 * Chat Rooms API
 * GET /api/chat/rooms - List user's chat rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserChatRooms } from '@/lib/chat/accessControl';
import { getChatRoomByOrderItemId } from '@/lib/chat/roomManager';
import { getRoomsQuerySchema } from '@/lib/validations/chat';

/**
 * GET /api/chat/rooms
 * List all chat rooms for the authenticated user
 * Query params:
 * - orderItemId: Optional filter by order item ID
 */
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('X-User-Id');
    const userRole = request.headers.get('X-User-Role');

    if (!userId || !userRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      orderItemId: searchParams.get('orderItemId') || undefined,
      flagged: searchParams.get('flagged') || undefined,
    };

    const validation = getRoomsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderItemId, flagged } = validation.data;

    // If orderItemId is provided, return specific room
    if (orderItemId) {
      const room = await getChatRoomByOrderItemId(orderItemId);

      if (!room) {
        return NextResponse.json(
          { success: false, error: 'Chat room not found for this order item' },
          { status: 404 }
        );
      }

      // Verify user has access to this room
      const hasAccess =
        userRole === UserRole.ADMIN ||
        (userRole === UserRole.CUSTOMER && room.customer.userId === userId) ||
        (userRole === UserRole.VENDOR && room.vendor.userId === userId);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this chat room' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          orderItemId: room.orderItemId,
          customerId: room.customerId,
          vendorId: room.vendorId,
          isActive: room.isActive,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          customer: {
            firstName: room.customer.user.firstName,
            lastName: room.customer.user.lastName,
          },
          vendor: {
            businessName: room.vendor.businessName,
          },
          orderItem: room.orderItem,
        },
      });
    }

    // Get all rooms for user
    let rooms = await getUserChatRooms(userId, userRole as UserRole);

    // Filter flagged rooms if requested (admin only)
    if (flagged && userRole === UserRole.ADMIN) {
      // Note: We don't have a direct "flagged" field, so we check for rooms with blocked content
      // This would require a join with messages. For now, return all rooms.
      // In production, you'd add a flagged field to ChatRoom or query messages
    }

    // Format response
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      orderItemId: room.orderItemId,
      customerId: room.customerId,
      vendorId: room.vendorId,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      unreadCount: room.messages.filter((m) => !m.isRead && m.senderId !== userId).length,
      lastMessage: room.messages[0]
        ? {
            content: room.messages[0].content,
            createdAt: room.messages[0].createdAt,
            senderId: room.messages[0].senderId,
          }
        : null,
      customer: {
        firstName: room.customer.user.firstName,
        lastName: room.customer.user.lastName,
      },
      vendor: {
        businessName: room.vendor.businessName,
      },
      orderItem: {
        productSnapshot: room.orderItem.productSnapshot,
        variantSnapshot: room.orderItem.variantSnapshot,
        order: room.orderItem.order,
      },
    }));

    return NextResponse.json({
      success: true,
      rooms: formattedRooms,
      total: formattedRooms.length,
    });
  } catch (error) {
    console.error('[API] Error fetching chat rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat rooms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms
 * Create or get a chat room for an order item
 * Body: { orderItemId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    const userRole = request.headers.get('X-User-Role');

    if (!userId || !userRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderItemId } = body;

    if (!orderItemId) {
      return NextResponse.json({ success: false, error: 'orderItemId is required' }, { status: 400 });
    }

    // 1. Check if room already exists
    let room = await getChatRoomByOrderItemId(orderItemId);

    if (room) {
      // Verify access to existing room
      const hasAccess =
        userRole === UserRole.ADMIN ||
        (userRole === UserRole.CUSTOMER && room.customer.userId === userId) ||
        (userRole === UserRole.VENDOR && room.vendor.userId === userId);

      if (!hasAccess) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ success: true, roomId: room.id });
    }

    // 2. Room doesn't exist, verify user has access to this order item to create it
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        vendor: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json({ success: false, error: 'Order item not found' }, { status: 404 });
    }

    // Check relationship validation
    const isCustomer = userRole === UserRole.CUSTOMER && orderItem.order.customerId === (await prisma.customer.findUnique({ where: { userId } }))?.id;
    const isVendor = userRole === UserRole.VENDOR && orderItem.vendor.userId === userId;

    if (!isCustomer && !isVendor && userRole !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this order' }, { status: 403 });
    }

    // 3. Create the room
    const newRoom = await prisma.chatRoom.create({
      data: {
        orderItemId: orderItem.id,
        customerId: orderItem.order.customerId,
        vendorId: orderItem.vendorId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, roomId: newRoom.id });
  } catch (error) {
    console.error('[API] Error creating chat room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat room' },
      { status: 500 }
    );
  }
}
