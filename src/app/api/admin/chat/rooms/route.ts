/**
 * Admin Chat Rooms API
 * GET /api/admin/chat/rooms - List all chat rooms (admin oversight)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';


/**
 * GET /api/admin/chat/rooms
 * List all chat rooms with optional filters
 * Query params:
 * - flagged: Show only rooms with blocked content (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    // Auth check
    requireAdmin(request);

        // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const flagged = searchParams.get('flagged') === 'true';

    // Build query
    const where: any = {};

    if (flagged) {
      // Get rooms that have messages with blocked content
      where.messages = {
        some: {
          hasBlockedContent: true,
        },
      };
    }

    // Fetch rooms
    const rooms = await prisma.chatRoom.findMany({
      where,
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
                status: true,
                createdAt: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message
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

    // Calculate stats
    const stats = {
      totalRooms: rooms.length,
      flaggedRooms: rooms.filter((r) =>
        r.messages.some((m) => m.hasBlockedContent)
      ).length,
      activeRooms: rooms.filter((r) => r.isActive).length,
    };

    // Format response
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      orderItemId: room.orderItemId,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      messageCount: room._count.messages,
      hasBlockedContent: room.messages.some((m) => m.hasBlockedContent),
      lastMessage: room.messages[0]
        ? {
            id: room.messages[0].id,
            content: room.messages[0].content,
            hasBlockedContent: room.messages[0].hasBlockedContent,
            createdAt: room.messages[0].createdAt,
          }
        : null,
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
        status: room.orderItem.order.status,
        createdAt: room.orderItem.order.createdAt,
      },
      product: {
        name: (room.orderItem.productSnapshot as any).name,
        variant: room.orderItem.variantSnapshot,
      },
    }));

    return NextResponse.json({
      success: true,
      rooms: formattedRooms,
      stats,
      total: formattedRooms.length,
    });
  } catch (error) {
    console.error('[API] Error fetching admin chat rooms:', error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat rooms' },
      { status: 500 }
    );
  }
}
