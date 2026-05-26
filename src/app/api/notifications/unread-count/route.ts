/**
 * Unread Count API
 * GET - Get unread notification count for badge
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const count = await getUnreadCount(user.userId);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to get unread count:", error);
    return NextResponse.json({ success: false, error: "Failed to get unread count" }, { status: 500 });
  }
}
