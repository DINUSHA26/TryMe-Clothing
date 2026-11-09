import { NextRequest, NextResponse } from "next/server";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/rbac";

/**
 * Logout endpoint - clears authentication cookies, deactivates session, and writes audit log
 */
export async function POST(request: NextRequest) {
  try {
    // If a user is logging out, mark their session as inactive
    const accessToken =
      request.cookies.get("accessToken")?.value ||
      request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const payload =
      (accessToken ? tokenUtils.decode(accessToken) : null) ||
      (refreshToken ? tokenUtils.decode(refreshToken) : null);

    if (payload?.sessionId) {
      await prisma.userSession
        .update({
          where: { id: payload.sessionId },
          data: { isActive: false },
        })
        .catch(() => {});

      await prisma.adminSession
        .update({
          where: { id: payload.sessionId },
          data: { isActive: false },
        })
        .catch(() => {});
    }

    if (payload?.userId) {
      await logAudit({
        request,
        actorId: payload.userId,
        actorEmail: payload.email,
        actorRole: payload.role,
        action: "auth.logout",
        entity: "User",
        entityId: payload.userId,
        metadata: { sessionId: payload.sessionId || null },
        scope: payload.role === "ADMIN" ? "ADMIN" : payload.role === "VENDOR" ? "VENDOR" : "ADS_SELLER",
      });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });

    // Clear authentication cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during logout",
      },
      { status: 500 }
    );
  }
}
