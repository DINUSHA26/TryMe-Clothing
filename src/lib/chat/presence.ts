import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";

const PRESENCE_TTL_SECONDS = 90; // 90 seconds of inactivity = offline

/**
 * Marks a user as active/online right now in both Redis cache and PostgreSQL.
 */
export async function recordUserActivity(userId: string) {
  if (!userId) return;

  const now = new Date();

  // 1. Redis quick key for zero-latency presence check
  if (redis) {
    try {
      await redis.setex(`chat:presence:${userId}`, PRESENCE_TTL_SECONDS, now.toISOString());
    } catch (err) {
      console.warn("[Presence] Redis set failed:", err);
    }
  }

  // 2. Persist in database
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
  } catch (err) {
    // Silently ignore if user is deleted or missing
  }
}

/**
 * Retrieves the presence information of a user.
 */
export async function getUserPresence(userId: string): Promise<{
  isOnline: boolean;
  lastSeenAt: string | null;
}> {
  if (!userId) {
    return { isOnline: false, lastSeenAt: null };
  }

  // Check Redis first
  if (redis) {
    try {
      const activeInRedis = await redis.get(`chat:presence:${userId}`);
      if (activeInRedis) {
        return { isOnline: true, lastSeenAt: activeInRedis };
      }
    } catch (err) {
      // Fallback to database
    }
  }

  // Fallback to database lastSeenAt
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });

    if (!user || !user.lastSeenAt) {
      return { isOnline: false, lastSeenAt: null };
    }

    const elapsedMs = Date.now() - new Date(user.lastSeenAt).getTime();
    const isOnline = elapsedMs < 2 * 60 * 1000; // online if active within last 2 minutes

    return {
      isOnline,
      lastSeenAt: user.lastSeenAt.toISOString(),
    };
  } catch (err) {
    return { isOnline: false, lastSeenAt: null };
  }
}

/**
 * Formats a lastSeenAt timestamp into a clean WhatsApp-style string:
 * - "Online"
 * - "Last seen today at 6:21 AM"
 * - "Last seen yesterday at 11:42 PM"
 * - "Last seen Thursday at 3:15 PM"
 * - "Last seen Nov 5 at 3:30 PM"
 */
export function formatLastSeenWhatsApp(
  isOnline: boolean,
  lastSeenAt: string | Date | null | undefined
): string {
  if (isOnline) {
    return "Online";
  }

  if (!lastSeenAt) {
    return "Offline";
  }

  try {
    const date = new Date(lastSeenAt);
    if (isNaN(date.getTime())) return "Offline";

    const timeStr = format(date, "h:mm a");

    if (isToday(date)) {
      return `Last seen today at ${timeStr}`;
    }

    if (isYesterday(date)) {
      return `Last seen yesterday at ${timeStr}`;
    }

    const daysDiff = Math.abs(differenceInDays(new Date(), date));
    if (daysDiff < 7) {
      const dayName = format(date, "EEEE"); // e.g. "Thursday"
      return `Last seen ${dayName} at ${timeStr}`;
    }

    const dateFormatted = format(date, "MMM d"); // e.g. "Nov 5"
    return `Last seen ${dateFormatted} at ${timeStr}`;
  } catch {
    return "Offline";
  }
}

