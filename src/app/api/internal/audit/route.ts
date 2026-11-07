import { NextRequest, NextResponse } from "next/server";
import { verifyInternalSecret } from "@/lib/internal-auth";
import { logAudit } from "@/lib/rbac";

/**
 * Internal endpoint used ONLY by the Edge middleware to record admin write
 * actions (POST / PUT / PATCH / DELETE on /api/admin/*) in the audit log.
 */
export async function POST(request: NextRequest) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, email, method, path, permission, ip } = body || {};
    if (!userId || !method || !path) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await logAudit({
      actorId: String(userId),
      actorEmail: email ? String(email) : null,
      action: "api.mutation",
      entity: "AdminApi",
      entityId: String(path).slice(0, 200),
      metadata: { method: String(method), path: String(path).slice(0, 300), permission: permission || null },
      ip: ip ? String(ip) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
