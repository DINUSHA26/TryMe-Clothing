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
 * DELETE /api/auth/sessions/[id]
 * Revokes a specific active session for the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Verify session belongs to user
    const targetSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession || targetSession.userId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: "Session not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Mark as inactive
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    if (payload.role === "ADMIN") {
      await prisma.adminSession
        .update({
          where: { id: sessionId },
          data: { isActive: false },
        })
        .catch(() => {});
    }

    // Log to AuditLog
    await logAudit({
      request,
      actorId: payload.userId,
      actorEmail: payload.email,
      actorRole: payload.role,
      action: "auth.session_revoked",
      entity: "UserSession",
      entityId: sessionId,
      metadata: {
        revokedDevice: targetSession.device,
        revokedIp: targetSession.ip,
      },
      scope: payload.role === "ADMIN" ? "ADMIN" : payload.role === "VENDOR" ? "VENDOR" : "ADS_SELLER",
    });

    return NextResponse.json({
      success: true,
      data: { message: "Session revoked successfully" },
    });
  } catch (error) {
    console.error("DELETE session error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
