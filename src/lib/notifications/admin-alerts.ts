import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

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

    // 2. Persist notification records in DB for all ADMIN users
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((u) => ({
            userId: u.id,
            type: alert.type === "NEW_ORDER" ? "ORDER_PAYMENT_CONFIRMED" : "SYSTEM_ANNOUNCEMENT",
            category: alert.type === "NEW_ORDER" ? "ORDER" : "SYSTEM",
            priority: "HIGH",
            title: alert.title,
            message: alert.message,
            link: alert.link,
            isRead: false,
          })),
        });
      }
    } catch (dbErr) {
      // Non-fatal if notification schema differs
      console.warn("[triggerAdminAlert DB Notice]:", dbErr);
    }
  } catch (error) {
    console.error("[triggerAdminAlert Error]:", error);
  }
}
