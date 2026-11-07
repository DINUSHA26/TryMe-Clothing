import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { handleAuthError } from "@/lib/auth-helpers";
import { passwordUtils } from "@/lib/auth";
import {
  canGrant,
  ensureDefaultRoles,
  generateTempPassword,
  logAudit,
  requirePermission,
} from "@/lib/rbac";

/**
 * GET /api/admin/staff  → list staff (+ super admins) and the roles the caller may assign
 * POST /api/admin/staff → invite a staff member (creates login with a temporary password)
 */
export async function GET(request: NextRequest) {
  try {
    const { access } = await requirePermission(request, "staff.view");
    await ensureDefaultRoles();

    const [staff, roles, superAdmins] = await Promise.all([
      prisma.staffMember.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          role: { select: { id: true, name: true, permissions: true } },
          user: {
            select: { id: true, email: true, phone: true, firstName: true, lastName: true, isActive: true, mustChangePassword: true },
          },
        },
      }),
      prisma.staffRole.findMany({ where: { scope: "ADMIN" }, orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { role: UserRole.ADMIN, staffMember: null },
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
      }),
    ]);

    const assignableRoles = roles.filter((r) => canGrant(access, r.permissions));

    return NextResponse.json({
      success: true,
      data: {
        staff,
        superAdmins,
        roles: assignableRoles.map((r) => ({ id: r.id, name: r.name, description: r.description, permissions: r.permissions })),
        viewer: { isSuper: access.isSuper },
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] staff GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load staff. Make sure the database schema is up to date (npx prisma db push)." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, access } = await requirePermission(request, "staff.create");
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const roleId = String(body.roleId || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email is required" }, { status: 400 });
    }
    if (!firstName) {
      return NextResponse.json({ success: false, error: "First name is required" }, { status: 400 });
    }
    if (!roleId) {
      return NextResponse.json({ success: false, error: "Please choose a role" }, { status: 400 });
    }

    const role = await prisma.staffRole.findUnique({ where: { id: roleId } });
    if (!role || role.scope !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    // Privilege-escalation guard: you cannot hand out permissions you do not have
    if (!canGrant(access, role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot assign a role with permissions you do not hold yourself" },
        { status: 403 }
      );
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: { select: { id: true, businessName: true } },
        adsSeller: { select: { id: true, businessName: true } },
        staffMember: { select: { id: true, vendorId: true, adsSellerId: true } },
      },
    });

    const existingByPhone = phone
      ? await prisma.user.findFirst({
          where: { phone },
          select: { id: true, email: true },
        })
      : null;

    if (existingByPhone && (!existingByEmail || existingByPhone.id !== existingByEmail.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number is already registered to another account. Please use a different phone number or leave it blank.",
        },
        { status: 409 }
      );
    }

    const existing = existingByEmail;

    if (existing) {
      if (existing.staffMember) {
        return NextResponse.json(
          { success: false, error: "This user is already assigned as a staff member" },
          { status: 409 }
        );
      }
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await passwordUtils.hash(tempPassword);

    let created: any;
    if (existing) {
      created = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.ADMIN,
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          phone: phone || existing.phone,
          passwordHash,
          mustChangePassword: true,
          isActive: true,
          staffMember: {
            create: { roleId: role.id, invitedById: admin.userId, isActive: true },
          },
        },
        select: { id: true, email: true, firstName: true, lastName: true, staffMember: true },
      });
    } else {
      created = await prisma.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName: lastName || null,
          role: UserRole.ADMIN,
          passwordHash,
          mustChangePassword: true,
          isActive: true,
          staffMember: {
            create: { roleId: role.id, invitedById: admin.userId, isActive: true },
          },
        },
        select: { id: true, email: true, firstName: true, lastName: true, staffMember: true },
      });
    }

    await logAudit({
      request,
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "staff.invite",
      entity: "StaffMember",
      entityId: created.id,
      metadata: { email, roleId: role.id, roleName: role.name },
    });

    return NextResponse.json({
      success: true,
      data: { user: created, roleName: role.name, temporaryPassword: tempPassword },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] staff POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create staff member" }, { status: 500 });
  }
}

