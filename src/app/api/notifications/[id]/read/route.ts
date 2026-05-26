/**
 * Mark Notification as Read API
 * PATCH - Mark single notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/lib/notifications";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
    }

    const notification = await markAsRead(notificationId, user.userId);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found or already read" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to mark notification as read:", error);
    return NextResponse.json({ success: false, error: "Failed to mark notification as read" }, { status: 500 });
  }
}
