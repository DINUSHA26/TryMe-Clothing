import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    const userRole = request.headers.get('X-User-Role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let socketId: string;
    let channelName: string;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      socketId = body.socket_id;
      channelName = body.channel_name;
    } else {
      const formData = await request.formData();
      socketId = formData.get('socket_id') as string;
      channelName = formData.get('channel_name') as string;
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
