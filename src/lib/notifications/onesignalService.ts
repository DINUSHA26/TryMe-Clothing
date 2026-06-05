// OneSignal Backend Service
// Helper to send push notifications via OneSignal REST API

const ONESIGNAL_API_URL = "https://api.onesignal.com/api/v1/notifications";
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "b6ab590e-bf4d-4545-8097-c3e4a4922410";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export interface SendPushNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
}

/**
 * Send a push notification to a user using their external ID (database User ID)
 */
export async function sendPushNotification(params: SendPushNotificationParams): Promise<boolean> {
  const { userId, title, message, link } = params;

  if (!ONESIGNAL_REST_API_KEY) {
    console.warn(
      "[OneSignal] ONESIGNAL_REST_API_KEY is not configured in .env. Skipping push notification."
    );
    return false;
  }

  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      contents: {
        en: message,
      },
      headings: {
        en: title,
      },
      include_aliases: {
        external_id: [userId],
      },
      target_channel: "push",
      ...(link && { url: link }),
    };

    console.log(`[OneSignal] Attempting to send push notification to user ${userId}...`);

    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[OneSignal] API responded with error:", data);
      return false;
    }

    console.log(`[OneSignal] Push notification sent successfully to user ${userId}:`, data);
    return true;
  } catch (error) {
    console.error("[OneSignal] Failed to send push notification:", error);
    return false;
  }
}
