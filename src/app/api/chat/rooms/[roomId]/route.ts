/**
 * Chat Room Details API
 * GET /api/chat/rooms/[roomId] - Get room details
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { verifyRoomAccess } from '@/lib/chat/accessControl';

/**
 * GET /api/chat/rooms/[roomId]
 * Get detailed information about a specific chat room
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

    // Verify access and get room
    const room = await verifyRoomAccess(roomId, userId, userRole as UserRole);

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
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching room details:', error);

    if (error.message === 'Chat room not found') {
      return NextResponse.json({ success: false, error: 'Chat room not found' }, { status: 404 });
    }

    if (error.message.includes('Access denied')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch room details' },
      { status: 500 }
    );
  }
}
