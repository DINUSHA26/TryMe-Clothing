import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/admin/audit-logs?page=1&limit=30&action=&search=
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "audit.view");

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "30", 10) || 30));
    const action = sp.get("action") || undefined;
    const search = sp.get("search")?.trim() || undefined;

    const where: any = {};
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] audit-logs GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load audit logs. Make sure the database schema is up to date (npx prisma db push)." },
      { status: 500 }
    );
  }
}

