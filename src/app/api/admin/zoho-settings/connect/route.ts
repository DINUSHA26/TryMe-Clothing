import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { exchangeAuthCode } from "@/lib/services/zoho-campaigns";

/**
 * POST /api/admin/zoho-settings/connect
 * Admin only - Connect to Zoho Campaigns by exchanging the authorization code for tokens
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code is required." },
        { status: 400 }
      );
    }

    const exchangeResult = await exchangeAuthCode(code);

    if (!exchangeResult.success) {
      return NextResponse.json(
        { success: false, error: exchangeResult.error || "Failed to exchange authorization code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Zoho Campaigns!",
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error connecting Zoho Campaigns:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred during authentication exchange." },
      { status: 500 }
    );
  }
}
