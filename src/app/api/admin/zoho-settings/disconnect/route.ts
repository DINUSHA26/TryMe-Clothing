import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { saveZohoSettings } from "@/lib/services/zoho-campaigns";

/**
 * POST /api/admin/zoho-settings/disconnect
 * Admin only - Disconnect from Zoho Campaigns and clear tokens
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    await saveZohoSettings({
      refreshToken: "",
      accessToken: "",
      expiresAt: 0,
      isConnected: false,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully disconnected from Zoho Campaigns.",
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error disconnecting Zoho Campaigns:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while disconnecting." },
      { status: 500 }
    );
  }
}
