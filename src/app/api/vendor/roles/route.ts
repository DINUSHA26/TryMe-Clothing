import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import {
  canGrant,
  ensureDefaultVendorRoles,
  logAudit,
  requireVendorPermission,
  validatePermissionList,
} from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { access } = await requireVendorPermission(request, "roles.view");
    const vendorId = access.storeId;
    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    await ensureDefaultVendorRoles(vendorId);

    const roles = await prisma.staffRole.findMany({
      where: {
        scope: "VENDOR",
        OR: [{ vendorId }, { isSystem: true, vendorId: null }],
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { members: { where: { vendorId } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: { roles } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/roles GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: caller, access } = await requireVendorPermission(request, "roles.create");
    const vendorId = access.storeId;
    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ success: false, error: "Role name must be 2-60 characters" }, { status: 400 });
    }

    const perms = validatePermissionList(body.permissions ?? [], "VENDOR");
    if (!perms.ok) {
      return NextResponse.json({ success: false, error: perms.error }, { status: 400 });
    }
    if (!canGrant(access, perms.value)) {
      return NextResponse.json(
        { success: false, error: "You cannot grant permissions you do not hold yourself" },
        { status: 403 }
      );
    }

    const exists = await prisma.staffRole.findFirst({
      where: { name, scope: "VENDOR", vendorId },
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "A role with this name already exists in your store" }, { status: 409 });
    }

    const role = await prisma.staffRole.create({
      data: {
        name,
        description: body.description ? String(body.description).trim().slice(0, 200) : null,
        permissions: perms.value,
        scope: "VENDOR",
        vendorId,
        createdById: caller.userId,
      },
    });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "vendor.role.create",
      entity: "StaffRole",
      entityId: role.id,
      metadata: { name, permissionCount: perms.value.length },
      scope: "VENDOR",
      vendorId,
    });

    return NextResponse.json({ success: true, data: { role } }, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/roles POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create role" }, { status: 500 });
  }
}

