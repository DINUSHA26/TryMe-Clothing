/**
 * Single Notification API
 * GET - Get notification by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotificationById } from "@/lib/notifications";

/**
 * GET /api/notifications/[id]
 * Get single notification for authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Notification ID required" },
        { status: 400 }
      );
    }

    // Fetch notification (verifies ownership)
    const notification = await getNotificationById(notificationId, userId);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("[API] Failed to fetch notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}
