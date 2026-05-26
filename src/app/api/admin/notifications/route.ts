/**
 * Admin Notifications API
 * POST - Create system announcement
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createAnnouncementSchema } from "@/lib/validations/notification";

/**
 * POST /api/admin/notifications
 * Create system announcement (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");
    const userRole = request.headers.get("X-User-Role");

    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid announcement data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { title, message, type, recipientRole, metadata } = validation.data;

    // Determine recipients based on role
    let recipients: string[] = [];

    if (recipientRole === "ALL") {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      recipients = users.map((u) => u.id);
    } else {
      // Get users with specific role
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: recipientRole as UserRole,
        },
        select: { id: true },
      });
      recipients = users.map((u) => u.id);
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients found" },
        { status: 400 }
      );
    }

    // Create notifications for all recipients
    const notificationPromises = recipients.map((recipientId) =>
      createNotification({
        userId: recipientId,
        type,
        title,
        message,
        link: undefined, // System announcements don't have specific links
        metadata: {
          ...metadata,
          announcementType: title,
        },
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      data: {
        message: `Announcement sent to ${recipients.length} user(s)`,
        recipientCount: recipients.length,
      },
    });
  } catch (error) {
    console.error("[API] Failed to create announcement:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
