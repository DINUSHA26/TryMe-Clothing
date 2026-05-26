/**
 * Chat Validation Schemas
 * Zod schemas for chat-related API requests
 */

import { z } from 'zod';

/**
 * Send message schema
 */
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long (max 2000 characters)')
    .trim(),
});

/**
 * Get messages query schema
 */
export const getMessagesQuerySchema = z.object({
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
});

/**
 * Get rooms query schema (for finding by order item)
 */
export const getRoomsQuerySchema = z.object({
  orderItemId: z.string().optional(),
  flagged: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Flag room schema
 */
export const flagRoomSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long'),
});

// Type exports
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type GetRoomsQuery = z.infer<typeof getRoomsQuerySchema>;
export type FlagRoomInput = z.infer<typeof flagRoomSchema>;
