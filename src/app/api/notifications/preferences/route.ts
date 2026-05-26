/**
 * Notification Preferences API
 * GET - Get user preferences
 * PUT - Update user preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserPreferences, updateUserPreferences } from "@/lib/notifications";
import { updatePreferencesSchema } from "@/lib/validations/notification";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const preferences = await getUserPreferences(user.userId);
    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to get preferences:", error);
    return NextResponse.json({ success: false, error: "Failed to get preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();

    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid preferences", details: validation.error.issues },
        { status: 400 }
      );
    }

    const preferences = await updateUserPreferences(user.userId, validation.data);
    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] Failed to update preferences:", error);
    return NextResponse.json({ success: false, error: "Failed to update preferences" }, { status: 500 });
  }
}
