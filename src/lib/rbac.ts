import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireVendor, requireAdsSeller, AuthError } from "@/lib/auth-helpers";
import {
  AdminAccessInfo,
  StoreAccessInfo,
  isValidPermission,
  normalizePermissions,
  getAllPermissionsByScope,
} from "@/lib/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN RBAC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve what an ADMIN-role user may do.
 *  - No StaffMember record  → Super Admin (full access)
 *  - StaffMember record     → permissions of the assigned StaffRole (if active)
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
      permissions: active ? normalizePermissions(staff.role.permissions, "ADMIN") : [],
      roleId: staff.roleId,
      roleName: staff.role.name,
    };
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.warn("[RBAC] Tables missing – run `npx prisma db push`. Treating admin as Super Admin.");
      return { isSuper: true, isActive: true, permissions: [] };
    }
    throw error;
  }
}

/** Defense-in-depth guard for sensitive admin routes */
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. VENDOR RBAC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve what a VENDOR-role user may do in their store.
 *  - Direct Vendor owner (Vendor.userId == userId) → Owner (full access)
 *  - StaffMember record with vendorId               → permissions of assigned StaffRole
 */
export async function getVendorAccess(userId: string): Promise<StoreAccessInfo> {
  try {
    const ownerVendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true, businessName: true },
    });

    if (ownerVendor) {
      return {
        isOwner: true,
        isActive: true,
        permissions: [],
        storeId: ownerVendor.id,
        storeName: ownerVendor.businessName,
        scope: "VENDOR",
      };
    }

    const staff = await prisma.staffMember.findUnique({
      where: { userId },
      include: {
        role: true,
        vendor: { select: { id: true, businessName: true } },
        user: { select: { isActive: true } },
      },
    });

    if (staff && staff.vendor && staff.vendorId) {
      const active = staff.isActive && staff.user.isActive;
      return {
        isOwner: false,
        isActive: active,
        permissions: active ? normalizePermissions(staff.role.permissions, "VENDOR") : [],
        roleId: staff.roleId,
        roleName: staff.role.name,
        storeId: staff.vendorId,
        storeName: staff.vendor.businessName,
        scope: "VENDOR",
      };
    }

    return {
      isOwner: false,
      isActive: false,
      permissions: [],
      scope: "VENDOR",
    };
  } catch (error: any) {
    console.error("[RBAC] getVendorAccess error:", error);
    return { isOwner: false, isActive: false, permissions: [], scope: "VENDOR" };
  }
}

/** Defense-in-depth guard for vendor routes */
export async function requireVendorPermission(request: NextRequest, permission: string) {
  const vendorUser = requireVendor(request);
  const access = await getVendorAccess(vendorUser.userId);

  if (!access.isActive) {
    throw new AuthError("Your store staff account is disabled or not found", 403);
  }
  if (!access.isOwner && !access.permissions.includes(permission)) {
    throw new AuthError(`Forbidden: missing store permission "${permission}"`, 403);
  }
  return { user: vendorUser, access };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADS SELLER RBAC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve what an ADS_SELLER-role user may do in their store.
 *  - Direct AdsSeller owner (AdsSeller.userId == userId) → Owner (full access)
 *  - StaffMember record with adsSellerId                 → permissions of assigned StaffRole
 */
export async function getAdsSellerAccess(userId: string): Promise<StoreAccessInfo> {
  try {
    const ownerSeller = await prisma.adsSeller.findUnique({
      where: { userId },
      select: { id: true, businessName: true },
    });

    if (ownerSeller) {
      return {
        isOwner: true,
        isActive: true,
        permissions: [],
        storeId: ownerSeller.id,
        storeName: ownerSeller.businessName || "My Store",
        scope: "ADS_SELLER",
      };
    }

    const staff = await prisma.staffMember.findUnique({
      where: { userId },
      include: {
        role: true,
        adsSeller: { select: { id: true, businessName: true } },
        user: { select: { isActive: true } },
      },
    });

    if (staff && staff.adsSeller && staff.adsSellerId) {
      const active = staff.isActive && staff.user.isActive;
      return {
        isOwner: false,
        isActive: active,
        permissions: active ? normalizePermissions(staff.role.permissions, "ADS_SELLER") : [],
        roleId: staff.roleId,
        roleName: staff.role.name,
        storeId: staff.adsSellerId,
        storeName: staff.adsSeller.businessName || "My Store",
        scope: "ADS_SELLER",
      };
    }

    return {
      isOwner: false,
      isActive: false,
      permissions: [],
      scope: "ADS_SELLER",
    };
  } catch (error: any) {
    console.error("[RBAC] getAdsSellerAccess error:", error);
    return { isOwner: false, isActive: false, permissions: [], scope: "ADS_SELLER" };
  }
}

/** Defense-in-depth guard for ads seller routes */
export async function requireAdsSellerPermission(request: NextRequest, permission: string) {
  const sellerUser = requireAdsSeller(request);
  const access = await getAdsSellerAccess(sellerUser.userId);

  if (!access.isActive) {
    throw new AuthError("Your staff account is disabled or not found", 403);
  }
  if (!access.isOwner && !access.permissions.includes(permission)) {
    throw new AuthError(`Forbidden: missing store permission "${permission}"`, 403);
  }
  return { user: sellerUser, access };
}

// ─────────────────────────────────────────────────────────────────────────────
// Privilege escalation guards & validation
// ─────────────────────────────────────────────────────────────────────────────

export function canGrant(
  access: { isSuper?: boolean; isOwner?: boolean; permissions: string[] },
  wanted: string[]
): boolean {
  if (access.isSuper || access.isOwner) return true;
  return wanted.every((p) => access.permissions.includes(p));
}

export function validatePermissionList(
  input: unknown,
  scope: "ADMIN" | "VENDOR" | "ADS_SELLER" = "ADMIN"
): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "permissions must be an array" };
  const invalid = input.filter((p) => typeof p !== "string" || !isValidPermission(p, scope));
  if (invalid.length) return { ok: false, error: `Unknown permission(s): ${invalid.join(", ")}` };
  return { ok: true, value: normalizePermissions(input, scope) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Helper
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
  scope?: "ADMIN" | "VENDOR" | "ADS_SELLER";
  vendorId?: string | null;
  adsSellerId?: string | null;
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
        scope: params.scope ?? "ADMIN",
        vendorId: params.vendorId ?? null,
        adsSellerId: params.adsSellerId ?? null,
      },
    });
  } catch (error) {
    console.error("[Audit] Failed to write audit log:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default System Roles Seeding
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ADMIN_ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Vendor Manager",
    description: "Full management of vendor accounts, bank details, approvals and status",
    permissions: [
      "vendors.view", "vendors.create", "vendors.edit", "vendors.delete", "vendors.approve",
      "payouts.view",
    ],
  },
  {
    name: "Ads Seller Manager",
    description: "Manage classified ad sellers, ads dashboard, pricing plans and subscriptions",
    permissions: [
      "ads.sellers.view", "ads.sellers.edit", "ads.sellers.delete", "ads.sellers.approve",
      "ads.plans.view", "ads.plans.create", "ads.plans.edit", "ads.plans.approve",
    ],
  },
  {
    name: "Product & Order Manager",
    description: "Manage store products, category catalog, coupons and customer orders",
    permissions: [
      "products.view", "products.create", "products.edit", "products.delete", "products.approve",
      "orders.view", "orders.edit", "orders.approve",
      "categories.view", "categories.create", "categories.edit", "categories.delete",
      "coupons.view", "coupons.create", "coupons.edit", "coupons.delete",
      "reviews.view", "reviews.edit",
    ],
  },
  {
    name: "Chat Operations Manager",
    description: "Oversight and moderation of customer-vendor chats and platform notifications",
    permissions: [
      "chat.view", "chat.edit", "chat.delete",
      "notifications.view", "notifications.create",
      "ai.view",
    ],
  },
  {
    name: "Classified Ads Manager",
    description: "Moderate and approve marketplace classified ads and seller ad listings",
    permissions: [
      "ads.marketplace.view", "ads.marketplace.edit", "ads.marketplace.delete", "ads.marketplace.approve",
      "ads.plans.view", "ads.sellers.view",
    ],
  },
  {
    name: "Social & Media Manager",
    description: "Moderate social stories, posts, comments and customer product reviews",
    permissions: [
      "social.view", "social.edit", "social.delete",
      "reviews.view", "reviews.edit", "reviews.delete",
    ],
  },
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

export async function ensureDefaultRoles() {
  for (const role of DEFAULT_ADMIN_ROLES) {
    const existing = await prisma.staffRole.findFirst({
      where: { name: role.name, scope: "ADMIN" },
    });
    if (!existing) {
      await prisma.staffRole.create({
        data: {
          name: role.name,
          description: role.description,
          permissions: normalizePermissions(role.permissions, "ADMIN"),
          scope: "ADMIN",
          isSystem: true,
        },
      });
    }
  }
}

const DEFAULT_VENDOR_ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Store Manager",
    description: "Full management of products, services, orders, POS, coupons and settings",
    permissions: [
      "products.view", "products.create", "products.edit", "products.delete",
      "services.view", "services.create", "services.edit",
      "orders.view", "orders.edit",
      "pos.view", "pos.create",
      "coupons.view", "coupons.create", "coupons.edit",
      "reviews.view", "reviews.edit",
      "ai.view",
      "website.view", "website.edit",
      "settings.view", "settings.edit",
    ],
  },
  {
    name: "Cashier / POS Operator",
    description: "Operates store POS terminal, looks up products and views orders",
    permissions: [
      "pos.view", "pos.create",
      "products.view",
      "orders.view",
    ],
  },
  {
    name: "Order Fulfillment",
    description: "Processes customer orders and updates packing/shipping statuses",
    permissions: [
      "orders.view", "orders.edit",
      "products.view",
    ],
  },
  {
    name: "Catalog Editor",
    description: "Creates and edits store products, services, pricing and images",
    permissions: [
      "products.view", "products.create", "products.edit",
      "services.view", "services.create", "services.edit",
      "reviews.view", "reviews.edit",
    ],
  },
];

export async function ensureDefaultVendorRoles(vendorId: string) {
  const count = await prisma.staffRole.count({ where: { vendorId } });
  if (count > 0) return;
  for (const role of DEFAULT_VENDOR_ROLES) {
    await prisma.staffRole.create({
      data: {
        name: role.name,
        description: role.description,
        permissions: normalizePermissions(role.permissions, "VENDOR"),
        scope: "VENDOR",
        vendorId,
        isSystem: true,
      },
    });
  }
}

const DEFAULT_ADS_SELLER_ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Store Manager",
    description: "Full management of ads, products, services, orders, POS, coupons and storefront",
    permissions: [
      "ads.view", "ads.create", "ads.edit", "ads.delete",
      "products.view", "products.create", "products.edit", "products.delete",
      "services.view", "services.create", "services.edit",
      "orders.view", "orders.edit",
      "pos.view", "pos.create",
      "coupons.view", "coupons.create", "coupons.edit",
      "reviews.view", "reviews.edit",
      "ai.view",
      "website.view", "website.edit",
      "settings.view", "settings.edit",
    ],
  },
  {
    name: "Ad & Catalog Specialist",
    description: "Posts classified ads, manages catalog items and services",
    permissions: [
      "ads.view", "ads.create", "ads.edit",
      "products.view", "products.create", "products.edit",
      "services.view", "services.create", "services.edit",
    ],
  },
  {
    name: "Sales & Orders Agent",
    description: "Handles orders, POS checkout, and inquiries",
    permissions: [
      "orders.view", "orders.edit",
      "pos.view", "pos.create",
      "products.view",
      "ai.view",
    ],
  },
];

export async function ensureDefaultAdsSellerRoles(adsSellerId: string) {
  const count = await prisma.staffRole.count({ where: { adsSellerId } });
  if (count > 0) return;
  for (const role of DEFAULT_ADS_SELLER_ROLES) {
    await prisma.staffRole.create({
      data: {
        name: role.name,
        description: role.description,
        permissions: normalizePermissions(role.permissions, "ADS_SELLER"),
        scope: "ADS_SELLER",
        adsSellerId,
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
