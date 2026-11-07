import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import { passwordUtils } from "@/lib/auth";
import {
  canGrant,
  generateTempPassword,
  logAudit,
  requireVendorPermission,
} from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireVendorPermission(request, "staff.edit");
    const vendorId = access.storeId;
    const body = await request.json();

    const target = await prisma.staffMember.findUnique({
      where: { id },
      include: { role: true, user: true },
    });
    if (!target || target.vendorId !== vendorId) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    if (target.userId === caller.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role or status" },
        { status: 400 }
      );
    }
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
      if (!newRole || newRole.scope !== "VENDOR") {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }
      if (newRole.vendorId && newRole.vendorId !== vendorId) {
        return NextResponse.json({ success: false, error: "Role not found in store" }, { status: 404 });
      }
      if (!canGrant(access, newRole.permissions)) {
        return NextResponse.json(
          { success: false, error: "You cannot assign permissions you do not hold yourself" },
          { status: 403 }
        );
      }
      staffData.roleId = newRole.id;
      changes.role = { from: target.role.name, to: newRole.name };
    }

    if (typeof body.isActive === "boolean" && body.isActive !== target.isActive) {
      staffData.isActive = body.isActive;
      userData.isActive = body.isActive;
      changes.isActive = body.isActive;
    }

    if (typeof body.firstName === "string" && body.firstName.trim()) {
      userData.firstName = body.firstName.trim();
    }
    if (typeof body.lastName === "string") {
      userData.lastName = body.lastName.trim() || null;
    }

    if (body.resetPassword) {
      temporaryPassword = generateTempPassword();
      userData.passwordHash = await passwordUtils.hash(temporaryPassword);
      userData.mustChangePassword = true;
      changes.passwordReset = true;
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) {
        await tx.user.update({ where: { id: target.userId }, data: userData });
      }
      if (Object.keys(staffData).length) {
        await tx.staffMember.update({ where: { id: target.id }, data: staffData });
      }
    });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "vendor.staff.update",
      entity: "StaffMember",
      entityId: target.id,
      metadata: { targetEmail: target.user.email, changes },
      scope: "VENDOR",
      vendorId,
    });

    return NextResponse.json({
      success: true,
      data: {
        temporaryPassword,
        message: temporaryPassword ? "Password has been reset" : "Staff member updated",
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/staff PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update staff member" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireVendorPermission(request, "staff.edit");
    const vendorId = access.storeId;

    const target = await prisma.staffMember.findUnique({
      where: { id },
      include: { role: true, user: true },
    });
    if (!target || target.vendorId !== vendorId) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    if (target.userId === caller.userId) {
      return NextResponse.json({ success: false, error: "You cannot remove yourself" }, { status: 400 });
    }
    if (!canGrant(access, target.role.permissions)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: target.userId } });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "vendor.staff.delete",
      entity: "StaffMember",
      entityId: target.id,
      metadata: { email: target.user.email, role: target.role.name },
      scope: "VENDOR",
      vendorId,
    });

    return NextResponse.json({ success: true, message: "Staff member removed" });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/staff DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete staff member" }, { status: 500 });
  }
}

