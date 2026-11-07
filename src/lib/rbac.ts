import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth-helpers";
import {
  AdminAccessInfo,
  isValidPermission,
  normalizePermissions,
} from "@/lib/permissions";

/**
 * Resolve what an ADMIN-role user may do.
 *  - No StaffMember record  → Super Admin (full access)
 *  - StaffMember record     → permissions of the assigned StaffRole (if active)
 *
 * If the RBAC tables have not been created yet (schema not pushed), everybody is
 * treated as Super Admin so existing admins are never locked out.
 */
export async function getAdminAccess(userId: string): Promise<AdminAccessInfo> {
  try {
    const staff = await prisma.staffMember.findUnique({
      where: { userId },
      include: { role: true, user: { select: { isActive: true } } },
    });

    if (!staff) {
      return { isSuper: true, isActive: true, permissions: [] };
    }

    const active = staff.isActive && staff.user.isActive;
    return {
      isSuper: false,
      isActive: active,
      permissions: active ? normalizePermissions(staff.role.permissions) : [],
      roleId: staff.roleId,
      roleName: staff.role.name,
    };
  } catch (error: any) {
    // P2021 = table does not exist, P2022 = column does not exist
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.warn("[RBAC] Tables missing – run `npx prisma db push`. Treating admin as Super Admin.");
      return { isSuper: true, isActive: true, permissions: [] };
    }
    throw error;
  }
}

/**
 * Defense-in-depth guard for sensitive routes (the middleware already enforces
 * route level permissions, this re-checks inside the handler).
 * Throws AuthError(403) when the admin lacks the permission.
 */
export async function requirePermission(request: NextRequest, permission: string) {
  const admin = requireAdmin(request);
  const access = await getAdminAccess(admin.userId);

  if (!access.isActive) {
    throw new AuthError("Your staff account is disabled", 403);
  }
  if (!access.isSuper && !access.permissions.includes(permission)) {
    throw new AuthError(`Forbidden: missing permission "${permission}"`, 403);
  }
  return { admin, access };
}

/** True if every permission in `wanted` is held by the actor (Super Admin holds all) */
export function canGrant(access: AdminAccessInfo, wanted: string[]): boolean {
  if (access.isSuper) return true;
  return wanted.every((p) => access.permissions.includes(p));
}

export function validatePermissionList(input: unknown): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "permissions must be an array" };
  const invalid = input.filter((p) => typeof p !== "string" || !isValidPermission(p));
  if (invalid.length) return { ok: false, error: `Unknown permission(s): ${invalid.join(", ")}` };
  return { ok: true, value: normalizePermissions(input) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────────────

export function getClientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function logAudit(params: {
  request?: NextRequest;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        metadata: (params.metadata as any) ?? undefined,
        ip: params.ip ?? (params.request ? getClientIp(params.request) : null),
      },
    });
  } catch (error) {
    // Never break the main operation because auditing failed
    console.error("[Audit] Failed to write audit log:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default roles
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Support Agent",
    description: "Handles orders, disputes and customer communication",
    permissions: [
      "orders.view", "orders.edit",
      "disputes.view", "disputes.edit",
      "chat.view", "notifications.view", "reviews.view", "vendors.view",
    ],
  },
  {
    name: "Catalog Manager",
    description: "Manages products, categories and reviews",
    permissions: [
      "products.view", "products.create", "products.edit", "products.approve",
      "categories.view", "categories.create", "categories.edit",
      "reviews.view", "reviews.edit",
    ],
  },
  {
    name: "Finance Manager",
    description: "Payouts, plan payments and financial reports",
    permissions: [
      "payouts.view", "payouts.edit", "payouts.approve",
      "orders.view", "reports.view",
      "ads.plans.view", "ads.plans.approve", "websites.view",
    ],
  },
  {
    name: "Content Moderator",
    description: "Moderates social posts, reviews and listings",
    permissions: [
      "social.view", "social.edit", "social.delete",
      "reviews.view", "reviews.edit", "reviews.delete",
      "ads.marketplace.view", "ads.marketplace.edit", "ads.marketplace.approve",
      "chat.view",
    ],
  },
];

/** Create the default roles the first time the roles list is requested */
export async function ensureDefaultRoles() {
  const count = await prisma.staffRole.count({ where: { scope: "ADMIN" } });
  if (count > 0) return;
  for (const role of DEFAULT_ROLES) {
    await prisma.staffRole.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        permissions: normalizePermissions(role.permissions),
        scope: "ADMIN",
        isSystem: true,
      },
    });
  }
}

/** Random temporary password for invited staff */
export function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out + "#7";
}
