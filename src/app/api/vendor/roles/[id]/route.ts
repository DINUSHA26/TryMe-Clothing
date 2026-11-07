import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import {
  canGrant,
  logAudit,
  requireVendorPermission,
  validatePermissionList,
} from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireVendorPermission(request, "roles.edit");
    const vendorId = access.storeId;
    const body = await request.json();

    const role = await prisma.staffRole.findUnique({ where: { id } });
    if (!role || role.scope !== "VENDOR") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.vendorId && role.vendorId !== vendorId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    if (!canGrant(access, role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot edit a role that holds permissions you do not possess" },
        { status: 403 }
      );
    }

    const data: { name?: string; description?: string | null; permissions?: string[] } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json({ success: false, error: "Name must be 2-60 characters" }, { status: 400 });
      }
      if (name !== role.name) {
        const clash = await prisma.staffRole.findFirst({
          where: { name, scope: "VENDOR", vendorId },
        });
        if (clash && clash.id !== role.id) {
          return NextResponse.json({ success: false, error: "A role with this name already exists in your store" }, { status: 409 });
        }
        data.name = name;
      }
    }

    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim().slice(0, 200) : null;
    }

    if (body.permissions !== undefined) {
      const perms = validatePermissionList(body.permissions, "VENDOR");
      if (!perms.ok) {
        return NextResponse.json({ success: false, error: perms.error }, { status: 400 });
      }
      if (!canGrant(access, perms.value)) {
        return NextResponse.json(
          { success: false, error: "You cannot grant permissions you do not hold yourself" },
          { status: 403 }
        );
      }
      data.permissions = perms.value;
    }

    const updated = await prisma.staffRole.update({ where: { id }, data });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "vendor.role.update",
      entity: "StaffRole",
      entityId: role.id,
      metadata: { name: updated.name, changes: Object.keys(data) },
      scope: "VENDOR",
      vendorId,
    });

    return NextResponse.json({ success: true, data: { role: updated } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/roles PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireVendorPermission(request, "roles.delete");
    const vendorId = access.storeId;

    const role = await prisma.staffRole.findUnique({
      where: { id },
      include: { _count: { select: { members: { where: { vendorId } } } } },
    });
    if (!role || role.scope !== "VENDOR") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.vendorId !== vendorId) {
      return NextResponse.json({ success: false, error: "Cannot delete default system templates" }, { status: 400 });
    }
    if (role.isSystem) {
      return NextResponse.json({ success: false, error: "System default roles cannot be deleted" }, { status: 400 });
    }
    if (role._count.members > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${role._count.members} staff member(s) currently hold this role` },
        { status: 400 }
      );
    }
    if (!canGrant(access, role.permissions)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions to delete this role" }, { status: 403 });
    }

    await prisma.staffRole.delete({ where: { id } });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "vendor.role.delete",
      entity: "StaffRole",
      entityId: id,
      metadata: { name: role.name },
      scope: "VENDOR",
      vendorId,
    });

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/roles DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}

