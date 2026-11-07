import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import {
  canGrant,
  logAudit,
  requirePermission,
  validatePermissionList,
} from "@/lib/rbac";

/** PATCH /api/admin/roles/[id] → update name / description / permissions */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, access } = await requirePermission(request, "roles.edit");
    const body = await request.json();

    const role = await prisma.staffRole.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    // You cannot edit a role that holds permissions beyond your own
    if (!canGrant(access, role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot edit a role with higher access than yours" },
        { status: 403 }
      );
    }

    // A staff member must not be able to escalate their own role
    if (!access.isSuper && access.roleId === role.id) {
      return NextResponse.json({ success: false, error: "You cannot edit your own role" }, { status: 400 });
    }

    const data: { name?: string; description?: string | null; permissions?: string[] } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json({ success: false, error: "Role name must be 2-60 characters" }, { status: 400 });
      }
      if (name !== role.name) {
        const clash = await prisma.staffRole.findFirst({ where: { name, scope: "ADMIN" } });
        if (clash) {
          return NextResponse.json({ success: false, error: "A role with this name already exists" }, { status: 409 });
        }
        data.name = name;
      }
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim().slice(0, 200) || null;
    }
    if (body.permissions !== undefined) {
      const perms = validatePermissionList(body.permissions);
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
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "role.update",
      entity: "StaffRole",
      entityId: id,
      metadata: {
        name: updated.name,
        before: role.permissions.length,
        after: updated.permissions.length,
      },
    });

    return NextResponse.json({ success: true, data: { role: updated } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] roles PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

/** DELETE /api/admin/roles/[id] → only for custom roles that have no members */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, access } = await requirePermission(request, "roles.delete");

    const role = await prisma.staffRole.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.isSystem) {
      return NextResponse.json({ success: false, error: "Default roles cannot be deleted" }, { status: 400 });
    }
    if (role._count.members > 0) {
      return NextResponse.json(
        { success: false, error: `Reassign the ${role._count.members} staff member(s) using this role first` },
        { status: 400 }
      );
    }
    if (!canGrant(access, role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot delete a role with higher access than yours" },
        { status: 403 }
      );
    }

    await prisma.staffRole.delete({ where: { id } });

    await logAudit({
      request,
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "role.delete",
      entity: "StaffRole",
      entityId: id,
      metadata: { name: role.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] roles DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}

