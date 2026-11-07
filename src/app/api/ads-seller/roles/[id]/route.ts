import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAuthError } from "@/lib/auth-helpers";
import {
  canGrant,
  logAudit,
  requireAdsSellerPermission,
  validatePermissionList,
} from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireAdsSellerPermission(request, "roles.edit");
    const adsSellerId = access.storeId;
    const body = await request.json();

    const role = await prisma.staffRole.findUnique({ where: { id } });
    if (!role || role.scope !== "ADS_SELLER") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.adsSellerId && role.adsSellerId !== adsSellerId) {
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
          where: { name, scope: "ADS_SELLER", adsSellerId },
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
      const perms = validatePermissionList(body.permissions, "ADS_SELLER");
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
      action: "ads-seller.role.update",
      entity: "StaffRole",
      entityId: role.id,
      metadata: { name: updated.name, changes: Object.keys(data) },
      scope: "ADS_SELLER",
      adsSellerId,
    });

    return NextResponse.json({ success: true, data: { role: updated } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] ads-seller/roles PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: caller, access } = await requireAdsSellerPermission(request, "roles.delete");
    const adsSellerId = access.storeId;

    const role = await prisma.staffRole.findUnique({
      where: { id },
      include: { _count: { select: { members: { where: { adsSellerId } } } } },
    });
    if (!role || role.scope !== "ADS_SELLER") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.adsSellerId !== adsSellerId) {
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
      action: "ads-seller.role.delete",
      entity: "StaffRole",
      entityId: id,
      metadata: { name: role.name },
      scope: "ADS_SELLER",
      adsSellerId,
    });

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] ads-seller/roles DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}

