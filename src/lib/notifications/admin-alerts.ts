import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { broadcastNotification } from "@/lib/notifications/notificationBroadcast";

export type AdminAlertType =
  | "NEW_ORDER"
  | "NEW_CUSTOMER"
  | "NEW_VENDOR"
  | "NEW_ADS_SELLER"
  | "NEW_ADS_SUBSCRIPTION"
  | "NEW_WEBSITE_SUBSCRIPTION";

export interface AdminAlertPayload {
  type: AdminAlertType;
  title: string;
  message: string;
  link: string;
  data?: any;
  createdAt?: string;
}

/**
 * Broadcast an instant alert to active admin sessions via Pusher
 * and optionally persist notification records in the database for all ADMIN users.
 */
export async function triggerAdminAlert(alert: AdminAlertPayload) {
  try {
    const payload = {
      ...alert,
      createdAt: alert.createdAt || new Date().toISOString(),
    };

    // 1. Broadcast instant event to Pusher channel
    await pusherServer.trigger("admin-alerts", "admin-notification", payload);

    // 2. Persist notification records in DB for all ADMIN users and broadcast to their private channel
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        try {
          const notif = await prisma.notification.create({
            data: {
              userId: admin.id,
              type: alert.type === "NEW_ORDER" ? "ORDER_PAYMENT_CONFIRMED" : "SYSTEM_ANNOUNCEMENT",
              category: alert.type === "NEW_ORDER" ? "ORDER" : "SYSTEM",
              priority: "HIGH",
              title: alert.title,
              message: alert.message,
              link: alert.link,
              isRead: false,
            },
          });

          // Broadcast in real-time to admin's private channel
          await broadcastNotification(admin.id, notif);
        } catch (adminErr) {
          console.warn(`[triggerAdminAlert] Broadcast to admin ${admin.id} failed:`, adminErr);
        }
      }
    } catch (dbErr) {
      console.warn("[triggerAdminAlert DB Notice]:", dbErr);
    }
  } catch (error) {
    console.error("[triggerAdminAlert Error]:", error);
  }
}
