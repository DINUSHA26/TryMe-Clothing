import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPresence, formatLastSeenWhatsApp, recordUserActivity } from "@/lib/chat/presence";

/**
 * GET /api/chat/rooms/[roomId]/presence
 * Returns real online presence & WhatsApp-style "last seen" of the other chat participant.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const callerId = request.headers.get("X-User-Id");
    if (!callerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Keep caller active
    await recordUserActivity(callerId);

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        customer: { select: { userId: true, id: true } },
        vendor: { select: { userId: true, id: true, businessName: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    // Determine target participant
    const isCustomer = room.customer?.userId === callerId;
    const targetUserId = isCustomer ? room.vendor?.userId : room.customer?.userId;

    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        presence: {
          isOnline: false,
          lastSeenAt: null,
          lastSeenText: "Offline",
        },
      });
    }

    const presence = await getUserPresence(targetUserId);
    const lastSeenText = formatLastSeenWhatsApp(presence.isOnline, presence.lastSeenAt);

    return NextResponse.json({
      success: true,
      presence: {
        targetUserId,
        isOnline: presence.isOnline,
        lastSeenAt: presence.lastSeenAt,
        lastSeenText,
      },
    });
  } catch (error) {
    console.error("[API] Presence error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch presence" }, { status: 500 });
  }
}

