import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenUtils } from "@/lib/auth";
import { logAudit } from "@/lib/rbac";

function getAuthPayload(request: NextRequest) {
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return tokenUtils.verifyAccessToken(token) || tokenUtils.decode(token);
}

/**
 * GET /api/auth/sessions
 * Returns all active sessions for the current authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const currentSessionId = payload.sessionId;

    const data = sessions.map((s) => ({
      id: s.id,
      device: s.device || "Unknown Device",
      browser: s.browser || "Unknown Browser",
      os: s.os || "Unknown OS",
      ip: s.ip || "Unknown IP",
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSessionId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: data,
        totalActive: data.length,
        currentSessionId: currentSessionId || null,
      },
    });
  } catch (error) {
    console.error("GET sessions error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sessions" }, { status: 500 });
  }
}

/**
 * POST /api/auth/sessions/revoke-others
 * Revokes all active sessions for this user EXCEPT the current session.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionId = payload.sessionId;

    // Deactivate all other sessions
    const filter = {
      userId: payload.userId,
      isActive: true,
      ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
    };

    const updateResult = await prisma.userSession.updateMany({
      where: filter,
      data: { isActive: false },
    });

    // Also update AdminSession if admin
    if (payload.role === "ADMIN") {
      await prisma.adminSession.updateMany({
        where: filter,
        data: { isActive: false },
      });
    }

    // Write to AuditLog
    await logAudit({
      request,
      actorId: payload.userId,
      actorEmail: payload.email,
      actorRole: payload.role,
      action: "auth.all_other_sessions_revoked",
      entity: "UserSession",
      metadata: {
        revokedCount: updateResult.count,
        retainedSessionId: currentSessionId || null,
      },
      scope: payload.role === "ADMIN" ? "ADMIN" : payload.role === "VENDOR" ? "VENDOR" : "ADS_SELLER",
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "All other sessions have been logged out successfully",
        revokedCount: updateResult.count,
      },
    });
  } catch (error) {
    console.error("Revoke other sessions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke sessions" },
      { status: 500 }
    );
  }
}

