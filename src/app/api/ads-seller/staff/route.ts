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
      if (existing.adsSeller) {
        return NextResponse.json(
          { success: false, error: "This email is registered to an ads seller owner and cannot be added as staff" },
          { status: 409 }
        );
      }
      if (existing.vendor) {
        return NextResponse.json(
          { success: false, error: "This email is registered to a store owner and cannot be added as staff" },
          { status: 409 }
        );
      }
      if (existing.role === UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: "Administrator accounts cannot be added as store staff" },
          { status: 409 }
        );
      }
      if (existing.staffMember) {
        if (existing.staffMember.adsSellerId === adsSellerId) {
          return NextResponse.json(
            { success: false, error: "This user is already a staff member in your store" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, error: "This user is already assigned as a staff member in another store" },
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
          role: UserRole.ADS_SELLER,
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          phone: phone || existing.phone,
          passwordHash,
          mustChangePassword: true,
          isActive: true,
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
    } else {
      created = await prisma.user.create({
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
    }

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

