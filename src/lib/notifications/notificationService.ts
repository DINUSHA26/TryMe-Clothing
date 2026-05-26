// Notification Service
// Core orchestrator for creating and managing notifications

import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationMetadata,
  NOTIFICATION_CONFIGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/types/notification";
import { generateNotificationContent } from "./notificationTemplates";
import type { Notification, NotificationPreference } from "@prisma/client";

// ==================== TYPES ====================

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  metadata?: NotificationMetadata;
  // Optional overrides (usually generated from template)
  title?: string;
  message?: string;
  link?: string;
}

export interface ListNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  isRead?: boolean;
}

export interface ListNotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

// ==================== CORE SERVICE ====================

/**
 * Create a notification
 * - Saves to database
 * - Emits Pusher event for real-time delivery
 * - Sends email if enabled in preferences
 *
 * NON-BLOCKING: Errors are logged but don't throw
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification | null> {
  try {
    const { userId, type, metadata } = params;

    // 1. Check user preferences
    const preferences = await getUserPreferences(userId);
    const config = NOTIFICATION_CONFIGS[type];

    // Skip if in-app notifications disabled
    if (!preferences.inAppEnabled) {
      console.log(`[Notifications] Skipped (in-app disabled): ${type} for user ${userId}`);
      return null;
    }

    // Check category preferences
    const categoryPref = (preferences.preferences as unknown as NotificationPreferences)[config.category];
    if (!categoryPref.inApp) {
      console.log(`[Notifications] Skipped (category disabled): ${type} for user ${userId}`);
      return null;
    }

    // 2. Generate notification content from template
    const content = generateNotificationContent(type, metadata);

    // Allow overrides
    const title = params.title || content.title;
    const message = params.message || content.message;
    const link = params.link || content.link;

    // 3. Save to database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        category: config.category,
        priority: config.priority,
        title,
        message,
        link,
        metadata: metadata as any,
        isRead: false,
      },
    });

    console.log(`[Notifications] Created: ${notification.id} (${type}) for user ${userId}`);

    // 4. Emit Pusher event for real-time delivery (non-blocking)
    try {
      // Dynamic import to avoid circular dependency
      const { broadcastNotification } = await import("./notificationBroadcast");
      await broadcastNotification(userId, notification);
    } catch (error) {
      console.error("[Notifications] Pusher broadcast failed:", error);
      // Continue - notification is still in DB
    }

    // 5. Send email if enabled (non-blocking)
    if (shouldSendEmail(preferences, config.category, type)) {
      try {
        await sendNotificationEmail(type, userId, metadata);
      } catch (error) {
        console.error("[Notifications] Email send failed:", error);
        // Continue - notification is still in DB
      }
    }

    return notification;
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
    return null; // Non-blocking: don't throw
  }
}

/**
 * Get paginated notifications for a user
 */
export async function getNotifications(
  params: ListNotificationsParams
): Promise<ListNotificationsResult> {
  const {
    userId,
    page = 1,
    limit = 20,
    category,
    isRead,
  } = params;

  const skip = (page - 1) * limit;

  // Build filter
  const where: any = { userId };
  if (category) where.category = category;
  if (isRead !== undefined) where.isRead = isRead;

  // Fetch notifications with pagination
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pageSize: limit,
  };
}

/**
 * Get single notification by ID
 */
export async function getNotificationById(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId, // Ensure ownership
    },
  });
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure ownership
        isRead: false, // Only update if unread
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      return null; // Already read or not found
    }

    // Fetch updated notification
    const updated = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Broadcast unread count update (non-blocking)
    try {
      const { broadcastUnreadCount } = await import("./notificationBroadcast");
      const unreadCount = await getUnreadCount(userId);
      await broadcastUnreadCount(userId, unreadCount);
    } catch (error) {
      console.error("[Notifications] Broadcast unread count failed:", error);
    }

    return updated;
  } catch (error) {
    console.error("[Notifications] Mark as read failed:", error);
    return null;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Broadcast unread count = 0 (non-blocking)
    try {
      const { broadcastUnreadCount } = await import("./notificationBroadcast");
      await broadcastUnreadCount(userId, 0);
    } catch (error) {
      console.error("[Notifications] Broadcast unread count failed:", error);
    }

    return result.count;
  } catch (error) {
    console.error("[Notifications] Mark all as read failed:", error);
    return 0;
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Delete a notification (soft delete by marking as read + hiding in UI)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure ownership
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("[Notifications] Delete failed:", error);
    return false;
  }
}

// ==================== PREFERENCES ====================

/**
 * Get user notification preferences (creates default if not exists)
 */
export async function getUserPreferences(
  userId: string
): Promise<NotificationPreference> {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if not exists
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        preferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
      },
    });
  }

  return preferences;
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  // Ensure preferences exist first
  await getUserPreferences(userId);

  const { userId: _, ...dataWithoutUserId } = updates;

  return prisma.notificationPreference.update({
    where: { userId },
    data: dataWithoutUserId as any,
  });
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if email should be sent based on preferences
 */
function shouldSendEmail(
  preferences: NotificationPreference,
  category: NotificationCategory,
  type: NotificationType
): boolean {
  // Global email disabled
  if (!preferences.emailEnabled) {
    return false;
  }

  // Check quiet hours
  if (preferences.quietHoursEnabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const start = preferences.quietHoursStart || 22;
    const end = preferences.quietHoursEnd || 7;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      if (currentHour >= start || currentHour < end) {
        return false; // Within quiet hours
      }
    } else {
      // Normal hours (e.g., 01:00 - 05:00)
      if (currentHour >= start && currentHour < end) {
        return false; // Within quiet hours
      }
    }
  }

  // Check category preferences
  const categoryPref = (preferences.preferences as any)[category];
  if (!categoryPref || !categoryPref.email) {
    return false;
  }

  // Check notification config default
  const config = NOTIFICATION_CONFIGS[type];
  return config.defaultEmailEnabled;
}

/**
 * Send notification email (delegates to email service)
 */
async function sendNotificationEmail(
  type: NotificationType,
  userId: string,
  metadata?: NotificationMetadata
): Promise<void> {
  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });

  if (!user || !user.email) {
    console.log(`[Notifications] No email for user ${userId}, skipping email`);
    return;
  }

  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  // Map notification type to email service method
  const config = NOTIFICATION_CONFIGS[type];
  const emailTemplate = config.emailTemplate;

  // Note: Email service methods will be created in Day 4
  // For now, log the email that would be sent
  console.log(`[Notifications] Would send email: ${emailTemplate} to ${user.email}`);

  // TODO: Day 4 - Call actual email service method
  // Example: await emailService[emailTemplate](user.email, metadata);
}

// ==================== CLEANUP ====================

/**
 * Delete expired notifications (90+ days old)
 * Should be run as a cron job
 */
export async function deleteExpiredNotifications(): Promise<number> {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`[Notifications] Deleted ${result.count} expired notifications`);
    return result.count;
  } catch (error) {
    console.error("[Notifications] Cleanup failed:", error);
    return 0;
  }
}
