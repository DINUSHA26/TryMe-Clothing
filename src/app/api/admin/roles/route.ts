import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import {
  canGrant,
  ensureDefaultRoles,
  logAudit,
  requirePermission,
  validatePermissionList,
} from "@/lib/rbac";

/** GET /api/admin/roles → list roles with member counts */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "roles.view");
    await ensureDefaultRoles();

    const { searchParams } = request.nextUrl;
    const scope = searchParams.get("scope") || "ADMIN";
    const vendorId = searchParams.get("vendorId") || "";
    const adsSellerId = searchParams.get("adsSellerId") || "";

    const roleWhere: any = {};
    if (scope === "ADMIN") {
      roleWhere.scope = "ADMIN";
    } else if (scope === "VENDOR") {
      roleWhere.scope = "VENDOR";
      if (vendorId) roleWhere.vendorId = vendorId;
    } else if (scope === "ADS_SELLER") {
      roleWhere.scope = "ADS_SELLER";
      if (adsSellerId) roleWhere.adsSellerId = adsSellerId;
    }

    const roles = await prisma.staffRole.findMany({
      where: roleWhere,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true } },
        vendor: { select: { id: true, businessName: true } },
        adsSeller: { select: { id: true, businessName: true } },
      },
    });

    return NextResponse.json({ success: true, data: { roles } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] roles GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load roles. Make sure the database schema is up to date (npx prisma db push)." },
      { status: 500 }
    );
  }
}

/** POST /api/admin/roles → create a role { name, description?, permissions[] } */
export async function POST(request: NextRequest) {
  try {
    const { admin, access } = await requirePermission(request, "roles.create");
    const body = await request.json();

    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ success: false, error: "Role name must be 2-60 characters" }, { status: 400 });
    }

    const perms = validatePermissionList(body.permissions ?? []);
    if (!perms.ok) {
      return NextResponse.json({ success: false, error: perms.error }, { status: 400 });
    }
    if (!canGrant(access, perms.value)) {
      return NextResponse.json(
        { success: false, error: "You cannot grant permissions you do not hold yourself" },
        { status: 403 }
      );
    }

    const exists = await prisma.staffRole.findFirst({ where: { name, scope: "ADMIN" } });
    if (exists) {
      return NextResponse.json({ success: false, error: "A role with this name already exists" }, { status: 409 });
    }

    const role = await prisma.staffRole.create({
      data: {
        name,
        description: body.description ? String(body.description).trim().slice(0, 200) : null,
        permissions: perms.value,
        scope: "ADMIN",
        createdById: admin.userId,
      },
    });

    await logAudit({
      request,
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "role.create",
      entity: "StaffRole",
      entityId: role.id,
      metadata: { name, permissionCount: perms.value.length },
    });

    return NextResponse.json({ success: true, data: { role } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] roles POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create role" }, { status: 500 });
  }
}

