import type { Notification } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

/**
 * Broadcast new notification to user via Pusher
 */
export async function broadcastNotification(
  userId: string,
  notification: Notification
): Promise<void> {
  try {
    await pusherServer.trigger(`private-user-${userId}`, "new-notification", {
      notification,
    });
    console.log(`[Notifications] Broadcasted to private-user-${userId}`);
  } catch (error) {
    console.error("[Notifications] Pusher broadcast failed:", error);
  }
}

/**
 * Broadcast unread count update to user via Pusher
 */
export async function broadcastUnreadCount(
  userId: string,
  count: number
): Promise<void> {
  try {
    await pusherServer.trigger(`private-user-${userId}`, "unread-count-update", {
      count,
    });
    console.log(`[Notifications] Unread count broadcasted to private-user-${userId}: ${count}`);
  } catch (error) {
    console.error("[Notifications] Pusher unread count broadcast failed:", error);
  }
}

