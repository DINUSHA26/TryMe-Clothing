/**
 * Chat Messages API
 * GET /api/chat/rooms/[roomId]/messages - Load message history
 * POST /api/chat/rooms/[roomId]/messages - Send message (REST fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { verifyRoomAccess, canSendMessage } from '@/lib/chat/accessControl';
import { filterContactInfo } from '@/lib/utils/contactFilter';
import { prisma } from '@/lib/prisma';
import { sendMessageSchema, getMessagesQuerySchema } from '@/lib/validations/chat';

/**
 * GET /api/chat/rooms/[roomId]/messages
 * Load message history with pagination
 * Query params:
 * - offset: Number of messages to skip (default: 0)
 * - limit: Number of messages to return (default: 50, max: 100)
 */
export async function GET(
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      offset: searchParams.get('offset') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validation = getMessagesQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { offset, limit } = validation.data;

    // Fetch messages
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
      orderBy: { createdAt: 'desc' }, // Newest first for pagination
      skip: offset,
      take: limit,
    });

    // Reverse to get chronological order (oldest first)
    const chronologicalMessages = messages.reverse();

    // Get total count
    const total = await prisma.chatMessage.count({
      where: { chatRoomId: roomId },
    });

    // Format response
    const formattedMessages = chronologicalMessages.map((message) => ({
      id: message.id,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      content: message.content,
      hasBlockedContent: message.hasBlockedContent,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        role: message.sender.role,
      },
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('[API] Error fetching messages:', error);

    if (error.message === 'Chat room not found') {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    if (error.message.includes('Access denied')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST /api/chat/rooms/[roomId]/messages
 * Send a message (REST fallback when Pusher is unavailable)
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Check if user can send messages (Admin/Customer/Vendor)
    const canSend = await canSendMessage(roomId, userId, userRole as UserRole);

    if (!canSend) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to send messages in this room' },
        { status: 403 }
      );
    }

    // Verify access
    await verifyRoomAccess(roomId, userId, userRole as UserRole);

    // Filter contact information
    const filterResult = filterContactInfo(content);

    // Save message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId: userId,
        content: filterResult.filteredContent,
        contentFiltered: filterResult.hasBlockedContent ? filterResult.filteredContent : null,
        hasBlockedContent: filterResult.hasBlockedContent,
        isRead: false,
      },
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
    });

    // Update room's last activity
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Format response
    const formattedMessage = {
      id: message.id,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      content: message.content,
      hasBlockedContent: message.hasBlockedContent,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        role: message.sender.role,
      },
    };

    // Trigger Pusher event
    try {
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-room-${roomId}`, 'new-message', {
        message: formattedMessage,
      });
      
      // Also notify the user specifically for unread counts etc if needed
      // but for now, just the room channel is enough for active chats
    } catch (pusherError) {
      console.error('[Pusher] Trigger failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
      contactBlocked: filterResult.hasBlockedContent,
      violations: filterResult.hasBlockedContent ? filterResult.violations : undefined,
    });
  } catch (error: any) {
    console.error('[API] Error sending message:', error);

    if (error.message === 'Chat room not found') {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    if (error.message.includes('Access denied')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
