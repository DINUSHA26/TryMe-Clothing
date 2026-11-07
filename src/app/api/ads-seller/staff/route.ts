import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { handleAuthError } from "@/lib/auth-helpers";
import { passwordUtils } from "@/lib/auth";
import {
  canGrant,
  ensureDefaultAdsSellerRoles,
  generateTempPassword,
  logAudit,
  requireAdsSellerPermission,
} from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { access } = await requireAdsSellerPermission(request, "staff.view");
    const adsSellerId = access.storeId;
    if (!adsSellerId) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    await ensureDefaultAdsSellerRoles(adsSellerId);

    const [staff, roles, seller] = await Promise.all([
      prisma.staffMember.findMany({
        where: { adsSellerId },
        orderBy: { createdAt: "desc" },
        include: {
          role: { select: { id: true, name: true, permissions: true } },
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
              isActive: true,
              mustChangePassword: true,
            },
          },
        },
      }),
      prisma.staffRole.findMany({
        where: {
          scope: "ADS_SELLER",
          OR: [{ adsSellerId }, { isSystem: true, adsSellerId: null }],
        },
        orderBy: { name: "asc" },
      }),
      prisma.adsSeller.findUnique({
        where: { id: adsSellerId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
        },
      }),
    ]);

    const assignableRoles = roles.filter((r) => canGrant(access, r.permissions));

    return NextResponse.json({
      success: true,
      data: {
        staff,
        storeOwner: seller?.user || null,
        roles: assignableRoles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.permissions,
        })),
        viewer: { isOwner: access.isOwner },
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] ads-seller/staff GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load store staff" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: caller, access } = await requireAdsSellerPermission(request, "staff.create");
    const adsSellerId = access.storeId;
    if (!adsSellerId) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

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
    if (!role || role.scope !== "ADS_SELLER") {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }
    if (role.adsSellerId && role.adsSellerId !== adsSellerId) {
      return NextResponse.json({ success: false, error: "Unauthorized role assignment" }, { status: 403 });
    }
    if (!canGrant(access, role.permissions)) {
      return NextResponse.json(
        { success: false, error: "You cannot assign permissions you do not hold yourself" },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email or phone already exists" },
        { status: 409 }
      );
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await passwordUtils.hash(tempPassword);

    const created = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName: lastName || null,
        role: UserRole.ADS_SELLER,
        isActive: true,
        mustChangePassword: true,
        passwordHash,
        staffMember: {
          create: {
            roleId: role.id,
            adsSellerId,
            invitedById: caller.userId,
            isActive: true,
          },
        },
      },
      include: {
        staffMember: { include: { role: true } },
      },
    });

    await logAudit({
      request,
      actorId: caller.userId,
      actorEmail: caller.email,
      action: "ads-seller.staff.invite",
      entity: "StaffMember",
      entityId: created.staffMember?.id,
      metadata: { email, roleName: role.name, roleId: role.id },
      scope: "ADS_SELLER",
      adsSellerId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          tempPassword,
          staff: {
            id: created.staffMember?.id,
            userId: created.id,
            email: created.email,
            firstName: created.firstName,
            lastName: created.lastName,
            phone: created.phone,
            role: { id: role.id, name: role.name },
            isActive: true,
            mustChangePassword: true,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] ads-seller/staff POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to invite staff member" }, { status: 500 });
  }
}

