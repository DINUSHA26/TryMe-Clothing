import { NextRequest, NextResponse } from "next/server";
import { recordUserActivity } from "@/lib/chat/presence";

/**
 * POST /api/chat/presence/heartbeat
 * Heartbeat endpoint called by active chat clients every 30-45 seconds
 * to signal they are currently active / online.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await recordUserActivity(userId);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Heartbeat failed" }, { status: 500 });
  }
}

