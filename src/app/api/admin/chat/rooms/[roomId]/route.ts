/**
 * Admin Chat Room Details API
 * GET /api/admin/chat/rooms/[roomId] - View any chat room (admin oversight)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatRoomById } from '@/lib/chat/roomManager';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';


/**
 * GET /api/admin/chat/rooms/[roomId]
 * Get detailed information about any chat room (admin oversight)
 * Includes full message history and participant details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Check admin authorization
    // Auth check
    requireAdmin(request);

        // Get room details
    const room = await getChatRoomById(roomId);

    if (!room) {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    // Get all messages for this room
    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Count blocked messages
    const blockedMessageCount = messages.filter((m) => m.hasBlockedContent).length;

    // Format response
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
        hasBlockedContent: blockedMessageCount > 0,
        blockedMessageCount,
        messageCount: messages.length,
        customer: {
          id: room.customer.id,
          firstName: room.customer.user.firstName,
          lastName: room.customer.user.lastName,
          email: room.customer.user.email,
        },
        vendor: {
          id: room.vendor.id,
          businessName: room.vendor.businessName,
          email: room.vendor.user.email,
        },
        orderItem: {
          id: room.orderItem.id,
          productSnapshot: room.orderItem.productSnapshot,
          variantSnapshot: room.orderItem.variantSnapshot,
          order: room.orderItem.order,
        },
        messages: messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          hasBlockedContent: message.hasBlockedContent,
          isRead: message.isRead,
          createdAt: message.createdAt,
          sender: {
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            email: message.sender.email,
            role: message.sender.role,
          },
        })),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching admin room details:', error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: 'Failed to fetch room details' },
      { status: 500 }
    );
  }
}
