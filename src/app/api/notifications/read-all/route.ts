/**
 * Mark All Notifications as Read API
 * PATCH - Mark all unread notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/lib/notifications";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function PATCH(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const count = await markAllAsRead(user.userId);
    return NextResponse.json({
      success: true,
      data: { markedCount: count, message: `Marked ${count} notification(s) as read` },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to mark all as read:", error);
    return NextResponse.json({ success: false, error: "Failed to mark all notifications as read" }, { status: 500 });
  }
}
