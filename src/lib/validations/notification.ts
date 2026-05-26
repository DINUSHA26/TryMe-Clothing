// Notification Validation Schemas
// Zod schemas for notification CRUD operations and preferences

import { z } from "zod";
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from "@/types/notification";

// ==================== CREATE NOTIFICATION ====================

export const createNotificationSchema = z.object({
  userId: z.string().cuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  link: z.string().url().max(500).optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// ==================== MARK AS READ ====================

export const markAsReadSchema = z.object({
  notificationId: z.string().cuid(),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

// ==================== LIST NOTIFICATIONS ====================

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.nativeEnum(NotificationCategory).optional(),
  isRead: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean())
    .optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

// ==================== NOTIFICATION PREFERENCES ====================

// Category preferences structure
const categoryPreferencesSchema = z.object({
  email: z.boolean(),
  inApp: z.boolean(),
  priority: z.nativeEnum(NotificationPriority),
});

// Full preferences structure
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  preferences: z
    .object({
      ORDER: categoryPreferencesSchema,
      DISPUTE: categoryPreferencesSchema,
      PAYOUT: categoryPreferencesSchema,
      CHAT: categoryPreferencesSchema,
      SYSTEM: categoryPreferencesSchema,
    })
    .optional(),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.number().int().min(0).max(23).optional().nullable(),
  quietHoursEnd: z.number().int().min(0).max(23).optional().nullable(),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

// Update preferences (partial)
export const updatePreferencesSchema = notificationPreferencesSchema.partial();

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ==================== ADMIN: CREATE ANNOUNCEMENT ====================

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z
    .enum([
      NotificationType.SYSTEM_ANNOUNCEMENT,
      NotificationType.SYSTEM_MAINTENANCE,
    ])
    .default(NotificationType.SYSTEM_ANNOUNCEMENT),
  recipientRole: z.enum(["ALL", "ADMIN", "VENDOR", "CUSTOMER"]).default("ALL"),
  metadata: z.any().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
