import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import { requireVendorPermission } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { access } = await requireVendorPermission(request, "audit.view");
    const vendorId = access.storeId;
    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25")));
    const search = (searchParams.get("search") || "").trim();
    const action = (searchParams.get("action") || "").trim();

    const where: Prisma.AuditLogWhereInput = {
      vendorId,
      scope: "VENDOR",
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { actorEmail: { contains: search, mode: "insensitive" } },
              { action: { contains: search, mode: "insensitive" } },
              { entity: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

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
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/audit-logs GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load audit logs" }, { status: 500 });
  }
}

