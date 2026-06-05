import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getValidAccessToken } from "@/lib/services/zoho-campaigns";

/**
 * POST /api/admin/zoho-settings/test
 * Admin only - Test connection by forcing token refresh
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    // This will throw if not connected or refresh token fails
    const token = await getValidAccessToken();

    if (!token) {
      throw new Error("Unable to obtain a valid access token.");
    }

    return NextResponse.json({
      success: true,
      message: "Connection test successful! Valid access token retrieved.",
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error testing Zoho Campaigns connection:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Connection test failed." },
      { status: 400 }
    );
  }
}
