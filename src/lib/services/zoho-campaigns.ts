import { prisma } from "@/lib/prisma";

export interface ZohoSettings {
  clientId: string;
  clientSecret: string;
  accountsServer: string; // e.g., "https://accounts.zoho.com"
  listKey: string; // Zoho Campaigns Mailing List Key
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: number; // expiry timestamp (ms)
  isConnected: boolean;
}

const SETTINGS_KEY = "zoho_campaigns_settings";

/**
 * Maps the Zoho accounts server URL to the corresponding Campaigns API URL
 */
function getCampaignsApiUrl(accountsServer: string): string {
  const server = accountsServer.toLowerCase();
  if (server.includes(".in")) {
    return "https://campaigns.zoho.in";
  }
  if (server.includes(".eu")) {
    return "https://campaigns.zoho.eu";
  }
  if (server.includes(".com.au")) {
    return "https://campaigns.zoho.com.au";
  }
  return "https://campaigns.zoho.com";
}

/**
 * Retrieves the current Zoho settings from the database
 */
export async function getZohoSettings(): Promise<ZohoSettings | null> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: SETTINGS_KEY },
  });
  if (!setting) return null;
  return setting.value as unknown as ZohoSettings;
}

/**
 * Saves or updates Zoho settings in the database
 */
export async function saveZohoSettings(settings: Partial<ZohoSettings>): Promise<ZohoSettings> {
  const current = await getZohoSettings();
  const updated: ZohoSettings = {
    clientId: settings.clientId ?? current?.clientId ?? "",
    clientSecret: settings.clientSecret ?? current?.clientSecret ?? "",
    accountsServer: settings.accountsServer ?? current?.accountsServer ?? "https://accounts.zoho.com",
    listKey: settings.listKey ?? current?.listKey ?? "",
    refreshToken: settings.refreshToken ?? current?.refreshToken,
    accessToken: settings.accessToken ?? current?.accessToken,
    expiresAt: settings.expiresAt ?? current?.expiresAt,
    isConnected: settings.isConnected ?? current?.isConnected ?? false,
  };

  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: updated as any },
    create: { key: SETTINGS_KEY, value: updated as any },
  });

  return updated;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(code: string): Promise<{ success: boolean; error?: string }> {
  const settings = await getZohoSettings();
  if (!settings || !settings.clientId || !settings.clientSecret) {
    throw new Error("Zoho integration is not configured with Client ID and Client Secret.");
  }

  const accountsServer = settings.accountsServer || "https://accounts.zoho.com";
  const url = `${accountsServer}/oauth/v2/token`;
  
  // The redirect URI registered in your Zoho API Console
  const redirectUri = process.env.ZOHO_REDIRECT_URI || "https://tryme.lk/zoho-callback";

  const params = new URLSearchParams({
    code,
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.error) {
    return { success: false, error: data.error };
  }

  if (!data.refresh_token) {
    return { 
      success: false, 
      error: "No refresh token returned. If you are re-authorizing, please ensure you revoke access first or add access_type=offline and prompt=consent to the authorize URL." 
    };
  }

  await saveZohoSettings({
    refreshToken: data.refresh_token,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 60000, // 1 min safety buffer
    isConnected: true,
  });

  return { success: true };
}

/**
 * Gets a valid access token, refreshing it if expired
 */
export async function getValidAccessToken(): Promise<string> {
  const settings = await getZohoSettings();
  if (!settings || !settings.isConnected || !settings.refreshToken) {
    throw new Error("Zoho Campaigns integration is not connected.");
  }

  // Check if current access token is still valid (with 1 min buffer)
  if (settings.accessToken && settings.expiresAt && settings.expiresAt > Date.now()) {
    return settings.accessToken;
  }

  // Token is expired or missing; refresh it
  const accountsServer = settings.accountsServer || "https://accounts.zoho.com";
  const url = `${accountsServer}/oauth/v2/token`;

  const params = new URLSearchParams({
    refresh_token: settings.refreshToken,
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.error || !data.access_token) {
    throw new Error(`Failed to refresh Zoho token: ${data.error || "unknown error"}`);
  }

  await saveZohoSettings({
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 60000, // 1 min buffer
  });

  return data.access_token;
}

/**
 * Subscribes a contact to the configured Zoho Campaigns mailing list
 */
export async function subscribeContact(email: string): Promise<{ success: boolean; message?: string }> {
  const settings = await getZohoSettings();
  if (!settings || !settings.isConnected || !settings.listKey) {
    return { success: false, message: "Zoho Campaigns integration is not configured or list key is missing." };
  }

  try {
    const accessToken = await getValidAccessToken();
    const apiBaseUrl = getCampaignsApiUrl(settings.accountsServer);
    const url = `${apiBaseUrl}/api/v1.1/json/listsubscribe`;

    // Zoho listsubscribe requires contactinfo as a valid JSON string (double quoted keys and values)
    const contactInfoStr = JSON.stringify({
      "Contact Email": email
    });

    const params = new URLSearchParams({
      resfmt: "JSON",
      listkey: settings.listKey,
      contactinfo: contactInfoStr,
      source: "TryMe Website",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { success: false, message: `Invalid response from Zoho API: ${text}` };
    }

    if (data.status === "error") {
      return { success: false, message: data.message || "Failed to subscribe contact." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error subscribing contact to Zoho Campaigns:", error);
    return { success: false, message: error.message || "Unknown error occurred" };
  }
}
