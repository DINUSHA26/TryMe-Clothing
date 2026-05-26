/**
 * Notifications API
 * GET - List notifications with pagination and filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";
import { listNotificationsSchema } from "@/lib/validations/notification";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      category: searchParams.get("category") || undefined,
      isRead: searchParams.get("isRead") || undefined,
    };

    const validation = listNotificationsSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, category, isRead } = validation.data;

    const result = await getNotifications({
      userId: user.userId,
      page,
      limit,
      category,
      isRead,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to fetch notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
