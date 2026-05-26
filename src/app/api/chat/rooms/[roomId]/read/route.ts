/**
 * Mark Messages as Read API
 * PATCH /api/chat/rooms/[roomId]/read - Mark all unread messages as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { verifyRoomAccess } from '@/lib/chat/accessControl';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/chat/rooms/[roomId]/read
 * Mark all unread messages from other users as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Get user info from middleware headers
    const userId = request.headers.get('X-User-Id');
    const userRole = request.headers.get('X-User-Role');

    if (!userId || !userRole) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access
    await verifyRoomAccess(roomId, userId, userRole as UserRole);

    // Mark all unread messages from other users as read
    const result = await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Broadcast read event via Pusher
    if (result.count > 0) {
      try {
        const { pusherServer } = await import('@/lib/pusher');
        await pusherServer.trigger(`private-room-${roomId}`, 'messages-read', {
          roomId,
          readerId: userId,
        });
      } catch (pusherError) {
        console.error('[Pusher] Read event trigger failed:', pusherError);
      }
    }

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error: any) {
    console.error('[API] Error marking messages as read:', error);

    if (error.message === 'Chat room not found') {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    if (error.message.includes('Access denied')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
