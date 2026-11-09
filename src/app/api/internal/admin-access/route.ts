import { NextRequest, NextResponse } from "next/server";
import { verifyInternalSecret } from "@/lib/internal-auth";
import { getAdminAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/**
 * Internal endpoint used ONLY by the Edge middleware to look up an admin's
 * RBAC permissions (the Edge runtime cannot talk to the database directly).
 */
export async function GET(request: NextRequest) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");

  try {
    // If a session ID is provided, verify it is still active in the DB
    if (sessionId) {
      const session = await prisma.adminSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || !session.isActive || session.userId !== userId) {
        return NextResponse.json(
          {
            isSuper: false,
            isActive: false,
            permissions: [],
            sessionExpired: true,
            error: "session_limit_exceeded",
          },
          { status: 401 }
        );
      }

      // Update session activity time
      prisma.adminSession
        .update({
          where: { id: sessionId },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});
    }

    const access = await getAdminAccess(userId);
    return NextResponse.json(access, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[RBAC] admin-access lookup failed:", error);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}
