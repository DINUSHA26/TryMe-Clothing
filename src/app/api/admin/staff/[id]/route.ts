import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import { passwordUtils } from "@/lib/auth";
import {
  canGrant,
  generateTempPassword,
  logAudit,
  requirePermission,
} from "@/lib/rbac";

/**
 * PATCH /api/admin/staff/[id]
 * Body (all optional): { roleId, isActive, firstName, lastName, resetPassword }
 * [id] is the StaffMember id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin, access } = await requirePermission(request, "staff.edit");
    const body = await request.json();

    const target = await prisma.staffMember.findUnique({
      where: { id },
      include: { role: true, user: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    // Nobody can modify their own access
    if (target.userId === admin.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role or status" },
        { status: 400 }
      );
    }
    // Cannot manage someone with more power than you
    if (!canGrant(access, target.role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot manage a staff member with higher access than yours" },
        { status: 403 }
      );
    }

    const staffData: { roleId?: string; isActive?: boolean } = {};
    const userData: { isActive?: boolean; firstName?: string; lastName?: string | null; passwordHash?: string; mustChangePassword?: boolean } = {};
    const changes: Record<string, unknown> = {};
    let temporaryPassword: string | undefined;

    if (body.roleId && body.roleId !== target.roleId) {
      const newRole = await prisma.staffRole.findUnique({ where: { id: String(body.roleId) } });
      if (!newRole || newRole.scope !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      if (!canGrant(access, newRole.permissions)) {
        return NextResponse.json(
          { success: false, error: "You cannot assign a role with permissions you do not hold yourself" },
          { status: 403 }
        );
      }
      staffData.roleId = newRole.id;
      changes.role = { from: target.role.name, to: newRole.name };
    }

    if (typeof body.isActive === "boolean" && body.isActive !== target.isActive) {
      staffData.isActive = body.isActive;
      userData.isActive = body.isActive; // also blocks login when disabled
      changes.isActive = body.isActive;
    }

    if (typeof body.firstName === "string" && body.firstName.trim()) {
      userData.firstName = body.firstName.trim();
    }
    if (typeof body.lastName === "string") {
      userData.lastName = body.lastName.trim() || null;
    }

    if (body.resetPassword === true) {
      temporaryPassword = generateTempPassword();
      userData.passwordHash = await passwordUtils.hash(temporaryPassword);
      userData.mustChangePassword = true;
      changes.passwordReset = true;
    }

    await prisma.$transaction([
      ...(Object.keys(staffData).length
        ? [prisma.staffMember.update({ where: { id }, data: staffData })]
        : []),
      ...(Object.keys(userData).length
        ? [prisma.user.update({ where: { id: target.userId }, data: userData })]
        : []),
    ]);

    await logAudit({
      request,
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "staff.update",
      entity: "StaffMember",
      entityId: id,
      metadata: { email: target.user.email, ...changes },
    });

    return NextResponse.json({ success: true, data: { temporaryPassword } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] staff PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update staff member" }, { status: 500 });
  }
}

