import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getZohoSettings, saveZohoSettings } from "@/lib/services/zoho-campaigns";

/**
 * GET /api/admin/zoho-settings
 * Admin only - Get current Zoho Campaigns settings (redacted)
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const settings = await getZohoSettings();

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          clientId: "",
          hasSecret: false,
          accountsServer: "https://accounts.zoho.com",
          listKey: "",
          isConnected: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: settings.clientId,
        hasSecret: !!settings.clientSecret,
        accountsServer: settings.accountsServer,
        listKey: settings.listKey,
        isConnected: settings.isConnected,
      },
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching Zoho settings:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching settings." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/zoho-settings
 * Admin only - Save Zoho Campaigns settings
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { clientId, clientSecret, accountsServer, listKey } = body;

    if (!clientId || !accountsServer || !listKey) {
      return NextResponse.json(
        { success: false, error: "Client ID, accounts server, and list key are required." },
        { status: 400 }
      );
    }

    const currentSettings = await getZohoSettings();

    // Determine if secret was updated or kept same
    let secretToSave = clientSecret;
    if (!clientSecret || clientSecret === "••••••••••••••••") {
      secretToSave = currentSettings?.clientSecret || "";
    }

    const updated = await saveZohoSettings({
      clientId,
      clientSecret: secretToSave,
      accountsServer,
      listKey,
    });

    return NextResponse.json({
      success: true,
      data: {
        clientId: updated.clientId,
        hasSecret: !!updated.clientSecret,
        accountsServer: updated.accountsServer,
        listKey: updated.listKey,
        isConnected: updated.isConnected,
      },
      message: "Zoho Campaign settings saved successfully.",
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error saving Zoho settings:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while saving settings." },
      { status: 500 }
    );
  }
}
