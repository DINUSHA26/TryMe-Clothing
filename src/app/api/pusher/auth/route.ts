import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getAuthUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get('X-User-Id');
    let userRole = request.headers.get('X-User-Role');

    if (!userId) {
      const authUser = getAuthUser(request);
      if (authUser) {
        userId = authUser.userId;
        userRole = authUser.role;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let socketId = '';
    let channelName = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      socketId = (formData.get('socket_id') as string) || '';
      channelName = (formData.get('channel_name') as string) || '';
    } else {
      // Safely handle both JSON and URL-encoded "socket_id=...&channel_name=..." bodies
      // even when pusher-js sends Content-Type: application/json with a URL-encoded payload
      const rawBody = await request.text();
      const trimmed = rawBody.trim();
      if (trimmed.startsWith('{')) {
        const body = JSON.parse(trimmed);
        socketId = body.socket_id || '';
        channelName = body.channel_name || '';
      } else {
        const params = new URLSearchParams(trimmed);
        socketId = params.get('socket_id') || '';
        channelName = params.get('channel_name') || '';
      }
    }

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // Logic to verify user access to the channel
    // Example channel: private-room-clxq1234
    if (channelName.startsWith('private-room-')) {
      const roomId = channelName.replace('private-room-', '');

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          customer: true,
          vendor: true,
        },
      });

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const hasAccess =
        userRole === UserRole.ADMIN ||
        (userRole === UserRole.CUSTOMER && room.customer.userId === userId) ||
        (userRole === UserRole.VENDOR && room.vendor.userId === userId);

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (channelName.startsWith('private-user-')) {
      const channelUserId = channelName.replace('private-user-', '');
      if (channelUserId !== userId && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
