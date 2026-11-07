/**
 * RBAC permission catalogs for Admin, Vendor, and Ads Seller scopes.
 *
 * IMPORTANT: this file must stay free of Node / Prisma imports because it is used
 * by the Edge middleware AND by client components.
 *
 * Permission string format: "<feature>.<action>"  e.g. "orders.edit"
 *
 * - Super Admin (ADMIN user without StaffMember record) bypasses all admin checks.
 * - Store Owner (User linked directly to Vendor/AdsSeller) bypasses all store checks.
 * - Staff Members are strictly bounded by the permissions of their StaffRole.
 */

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";

export const ALL_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve"];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
};

export interface FeatureDef {
  key: string;
  label: string;
  group: string;
  description: string;
  /** Path segments below the dashboard base that belong to this feature */
  paths: string[];
  actions: PermissionAction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN PERMISSION CATALOG
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURES: FeatureDef[] = [
  // ── Marketplace ──
  { key: "vendors", group: "Marketplace", label: "Vendors", description: "Vendor accounts, approvals and bank details", paths: ["vendors", "bank-details"], actions: ["view", "create", "edit", "delete", "approve"] },
  { key: "categories", group: "Marketplace", label: "Categories", description: "Product categories & subcategories", paths: ["categories"], actions: ["view", "create", "edit", "delete"] },
  { key: "products", group: "Marketplace", label: "Products", description: "Moderate & manage all products", paths: ["products"], actions: ["view", "create", "edit", "delete", "approve"] },
  { key: "coupons", group: "Marketplace", label: "Coupons", description: "Platform-wide coupons", paths: ["coupons"], actions: ["view", "create", "edit", "delete"] },
  { key: "reviews", group: "Marketplace", label: "Reviews", description: "Moderate customer reviews", paths: ["reviews"], actions: ["view", "edit", "delete"] },
  // ── Sales & Finance ──
  { key: "orders", group: "Sales & Finance", label: "Orders", description: "All platform orders", paths: ["orders"], actions: ["view", "edit", "approve"] },
  { key: "payouts", group: "Sales & Finance", label: "Payouts", description: "Vendor payouts & settlements", paths: ["payouts"], actions: ["view", "edit", "approve"] },
  { key: "disputes", group: "Sales & Finance", label: "Disputes", description: "Customer / vendor disputes", paths: ["disputes"], actions: ["view", "edit", "approve"] },
  { key: "reports", group: "Sales & Finance", label: "Reports", description: "Revenue and analytics reports", paths: ["reports"], actions: ["view"] },
  // ── Communication ──
  { key: "notifications", group: "Communication", label: "Notifications", description: "Send & view notifications", paths: ["notifications"], actions: ["view", "create"] },
  { key: "chat", group: "Communication", label: "Chat Oversight & Management", description: "Monitor and manage customer / vendor chats", paths: ["chat"], actions: ["view", "edit", "delete"] },
  { key: "ai", group: "Communication", label: "AI Conversations", description: "AI assistant conversation logs", paths: ["ai-assistant", "ai-conversations"], actions: ["view"] },
  { key: "social", group: "Communication", label: "Social Moderation", description: "Moderate social posts & comments", paths: ["social"], actions: ["view", "edit", "delete"] },
  { key: "newsletter", group: "Communication", label: "Newsletter & Zoho", description: "Newsletter campaigns & Zoho sync", paths: ["newsletter", "zoho-settings"], actions: ["view", "create", "edit", "delete"] },
  // ── Ads & Marketplace ──
  { key: "ads.sellers", group: "Ads & Services", label: "Ads Sellers", description: "Ads seller accounts and ads dashboard", paths: ["ads-sellers", "ads-dashboard"], actions: ["view", "edit", "delete", "approve"] },
  { key: "ads.plans", group: "Ads & Services", label: "Ads Plans & Payments", description: "Ads plans and plan payments", paths: ["ads-plans", "ads-plan-payments"], actions: ["view", "create", "edit", "delete", "approve"] },
  { key: "ads.marketplace", group: "Ads & Services", label: "Marketplace Ads", description: "Moderate marketplace listings", paths: ["marketplace"], actions: ["view", "edit", "delete", "approve"] },
  { key: "websites", group: "Ads & Services", label: "Web Subscriptions", description: "Website builder subscriptions", paths: ["website-subscriptions"], actions: ["view", "edit", "approve"] },
  { key: "services.categories", group: "Ads & Services", label: "Service Categories", description: "Service categories & subcategories", paths: ["services/categories"], actions: ["view", "create", "edit", "delete"] },
  { key: "services", group: "Ads & Services", label: "All Services", description: "Moderate listed services", paths: ["services"], actions: ["view", "edit", "delete", "approve"] },
  // ── System ──
  { key: "settings", group: "System", label: "Platform Settings", description: "Global platform settings", paths: ["settings"], actions: ["view", "edit"] },
  { key: "staff", group: "System", label: "Staff Members", description: "Invite and manage admin staff", paths: ["staff", "access-control"], actions: ["view", "create", "edit"] },
  { key: "roles", group: "System", label: "Roles & Permissions", description: "Create roles and assign permissions", paths: ["roles"], actions: ["view", "create", "edit", "delete"] },
  { key: "audit", group: "System", label: "Audit Log", description: "View the activity audit log", paths: ["audit-logs"], actions: ["view"] },
];

export const FEATURE_GROUPS: string[] = Array.from(new Set(FEATURES.map((f) => f.group)));

export const ALL_PERMISSIONS: string[] = FEATURES.flatMap((f) =>
  f.actions.map((a) => `${f.key}.${a}`)
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. VENDOR PERMISSION CATALOG
// ─────────────────────────────────────────────────────────────────────────────

export const VENDOR_FEATURES: FeatureDef[] = [
  // ── Sales & Catalog ──
  { key: "products", group: "Catalog", label: "Products", description: "Manage products, stock variants & images", paths: ["products"], actions: ["view", "create", "edit", "delete"] },
  { key: "services", group: "Catalog", label: "Services", description: "Manage bespoke services & quotes", paths: ["services"], actions: ["view", "create", "edit", "delete"] },
  { key: "orders", group: "Sales", label: "Orders", description: "Process customer orders & update order items", paths: ["orders"], actions: ["view", "edit"] },
  { key: "pos", group: "Sales", label: "POS Billing", description: "Point of Sale billing & walk-in sales", paths: ["pos"], actions: ["view", "create"] },
  { key: "coupons", group: "Marketing", label: "Coupons", description: "Store discounts & promo codes", paths: ["coupons"], actions: ["view", "create", "edit", "delete"] },
  { key: "reviews", group: "Marketing", label: "Reviews", description: "Customer ratings & replies", paths: ["reviews"], actions: ["view", "edit"] },
  { key: "ai", group: "Communication", label: "AI Inquiries", description: "Customer conversations with store AI assistant", paths: ["ai-inquiries", "ai-conversations"], actions: ["view"] },
  // ── Storefront & Settings ──
  { key: "website", group: "Storefront", label: "Website Builder", description: "Custom storefront design, pages & domain", paths: ["website-builder", "website"], actions: ["view", "edit"] },
  { key: "wallet", group: "Finance", label: "Wallet & Payouts", description: "Store balance, earnings breakdown & withdrawals", paths: ["wallet", "reports"], actions: ["view", "create"] },
  { key: "settings", group: "Settings", label: "Store Settings", description: "Store details, shop status & contact info", paths: ["settings", "profile", "shop-status"], actions: ["view", "edit"] },
  { key: "staff", group: "Staff & Security", label: "Staff Members", description: "Invite store staff & assign roles", paths: ["staff", "access-control"], actions: ["view", "create", "edit"] },
  { key: "roles", group: "Staff & Security", label: "Custom Roles", description: "Create roles & customize store permissions", paths: ["roles"], actions: ["view", "create", "edit", "delete"] },
  { key: "audit", group: "Staff & Security", label: "Store Audit Log", description: "Track staff actions & changes", paths: ["audit-logs"], actions: ["view"] },
];

export const VENDOR_FEATURE_GROUPS: string[] = Array.from(new Set(VENDOR_FEATURES.map((f) => f.group)));

export const ALL_VENDOR_PERMISSIONS: string[] = VENDOR_FEATURES.flatMap((f) =>
  f.actions.map((a) => `${f.key}.${a}`)
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADS SELLER PERMISSION CATALOG
// ─────────────────────────────────────────────────────────────────────────────

export const ADS_SELLER_FEATURES: FeatureDef[] = [
  // ── Classifieds & Catalog ──
  { key: "ads", group: "Classifieds", label: "My Ads & Post Ad", description: "Post and manage classified ads", paths: ["my-ads", "post-ad", "ads"], actions: ["view", "create", "edit", "delete"] },
  { key: "products", group: "Catalog", label: "Products", description: "Store products & catalog items", paths: ["products"], actions: ["view", "create", "edit", "delete"] },
  { key: "services", group: "Catalog", label: "Services", description: "Service listings & customer inquiries", paths: ["services"], actions: ["view", "create", "edit", "delete"] },
  { key: "orders", group: "Sales", label: "Orders", description: "Process customer orders & delivery", paths: ["orders"], actions: ["view", "edit"] },
  { key: "pos", group: "Sales", label: "POS Billing", description: "Point of Sale register", paths: ["pos"], actions: ["view", "create"] },
  { key: "coupons", group: "Marketing", label: "Coupons", description: "Create store coupons", paths: ["coupons"], actions: ["view", "create", "edit", "delete"] },
  { key: "reviews", group: "Marketing", label: "Reviews", description: "Customer reviews & feedback", paths: ["reviews"], actions: ["view", "edit"] },
  { key: "ai", group: "Communication", label: "AI Inquiries", description: "AI inquiries from store visitors", paths: ["ai-inquiries", "ai-conversations"], actions: ["view"] },
  // ── Storefront & Settings ──
  { key: "plans", group: "Subscription", label: "Pricing Plans", description: "Ad subscription packages & renewals", paths: ["plans", "subscriptions"], actions: ["view", "edit"] },
  { key: "website", group: "Storefront", label: "Website Builder & Storefront", description: "Mini-website configuration & storefront", paths: ["website-builder", "storefront", "website"], actions: ["view", "edit"] },
  { key: "wallet", group: "Finance", label: "Wallet & Payouts", description: "Account wallet and payouts", paths: ["wallet"], actions: ["view", "create"] },
  { key: "settings", group: "Settings", label: "Settings", description: "Profile & business details", paths: ["settings", "profile"], actions: ["view", "edit"] },
  { key: "staff", group: "Staff & Security", label: "Staff Members", description: "Invite store staff & assign roles", paths: ["staff", "access-control"], actions: ["view", "create", "edit"] },
  { key: "roles", group: "Staff & Security", label: "Custom Roles", description: "Configure roles and permissions", paths: ["roles"], actions: ["view", "create", "edit", "delete"] },
  { key: "audit", group: "Staff & Security", label: "Activity Audit Log", description: "Store staff activity log", paths: ["audit-logs"], actions: ["view"] },
];

export const ADS_SELLER_FEATURE_GROUPS: string[] = Array.from(new Set(ADS_SELLER_FEATURES.map((f) => f.group)));

export const ALL_ADS_SELLER_PERMISSIONS: string[] = ADS_SELLER_FEATURES.flatMap((f) =>
  f.actions.map((a) => `${f.key}.${a}`)
);

// ─────────────────────────────────────────────────────────────────────────────
// Normalization and Validation
// ─────────────────────────────────────────────────────────────────────────────

export function getFeatureListByScope(scope: "ADMIN" | "VENDOR" | "ADS_SELLER" = "ADMIN"): FeatureDef[] {
  if (scope === "VENDOR") return VENDOR_FEATURES;
  if (scope === "ADS_SELLER") return ADS_SELLER_FEATURES;
  return FEATURES;
}

export function getAllPermissionsByScope(scope: "ADMIN" | "VENDOR" | "ADS_SELLER" = "ADMIN"): string[] {
  if (scope === "VENDOR") return ALL_VENDOR_PERMISSIONS;
  if (scope === "ADS_SELLER") return ALL_ADS_SELLER_PERMISSIONS;
  return ALL_PERMISSIONS;
}

export function isValidPermission(p: string, scope: "ADMIN" | "VENDOR" | "ADS_SELLER" = "ADMIN"): boolean {
  return getAllPermissionsByScope(scope).includes(p);
}

/**
 * Drop unknown permissions and ensure that any non-"view" action automatically includes "view".
 */
export function normalizePermissions(input: unknown, scope: "ADMIN" | "VENDOR" | "ADS_SELLER" = "ADMIN"): string[] {
  if (!Array.isArray(input)) return [];
  const validList = getAllPermissionsByScope(scope);
  const set = new Set<string>();
  for (const p of input) {
    if (typeof p === "string" && validList.includes(p)) set.add(p);
  }
  for (const p of Array.from(set)) {
    const [feature] = splitPermission(p);
    const viewKey = `${feature}.view`;
    if (validList.includes(viewKey)) set.add(viewKey);
  }
  return Array.from(set).sort();
}

export function splitPermission(p: string): [string, string] {
  const idx = p.lastIndexOf(".");
  return [p.slice(0, idx), p.slice(idx + 1)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Requirements & Resolution
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_OPEN_PAGES = ["/admin", "/admin/change-password", "/admin/login"];
const ADMIN_OPEN_API_PREFIXES = ["/api/admin/access", "/api/admin/reports/overview"];

const VENDOR_OPEN_PAGES = ["/vendor", "/vendor/change-password", "/vendor/login"];
const VENDOR_OPEN_API_PREFIXES = ["/api/vendor/access", "/api/vendor/reports/overview"];

const ADS_SELLER_OPEN_PAGES = ["/ads-seller", "/ads-seller/change-password", "/ads-seller/login"];
const ADS_SELLER_OPEN_API_PREFIXES = [
  "/api/ads-seller/access",
  "/api/ads-seller/reports/overview",
  "/api/vendor/reports/overview",
];

const APPROVE_RE = /(approve|reject|verify|confirm|resolve|release)/i;

export type RouteRequirement =
  | { type: "open" }
  | { type: "super" } // Owner / Super only
  | { type: "permission"; permission: string; feature: string; action: PermissionAction };

function methodToAction(method: string, rest: string[]): PermissionAction {
  const m = method.toUpperCase();
  const last = rest[rest.length - 1] || "";
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return "view";
  if (m === "DELETE") return "delete";
  if (APPROVE_RE.test(last)) return "approve";
  if (m === "POST") return rest.length === 0 ? "create" : "edit";
  return "edit"; // PUT / PATCH
}

function resolveGenericRouteRequirement(
  clean: string,
  method: string,
  openPages: string[],
  openApiPrefixes: string[],
  prefixes: string[],
  features: FeatureDef[]
): RouteRequirement {
  if (openPages.includes(clean)) return { type: "open" };
  if (openApiPrefixes.some((p) => clean === p || clean.startsWith(p + "/"))) return { type: "open" };

  let matchedPrefix: string | null = null;
  for (const p of prefixes) {
    if (clean === p.replace(/\/+$/, "")) return { type: "open" };
    if (clean.startsWith(p)) {
      matchedPrefix = p;
      break;
    }
  }
  if (!matchedPrefix) return { type: "super" };

  const segments = clean.slice(matchedPrefix.length).split("/").filter(Boolean);
  if (segments.length === 0) return { type: "open" };

  let best: { feature: FeatureDef; len: number } | null = null;
  for (const feature of features) {
    for (const path of feature.paths) {
      const parts = path.split("/");
      const matches = parts.every((part, i) => segments[i] === part);
      if (matches && (!best || parts.length > best.len)) {
        best = { feature, len: parts.length };
      }
    }
  }

  if (!best) return { type: "super" };

  const rest = segments.slice(best.len);
  let action = methodToAction(method, rest);
  if (!best.feature.actions.includes(action)) {
    action = best.feature.actions.includes("edit") ? "edit" : "view";
  }

  return {
    type: "permission",
    permission: `${best.feature.key}.${action}`,
    feature: best.feature.key,
    action,
  };
}

/** Admin route requirement resolver */
export function resolveRouteRequirement(pathname: string, method = "GET"): RouteRequirement {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return resolveGenericRouteRequirement(
    clean,
    method,
    ADMIN_OPEN_PAGES,
    ADMIN_OPEN_API_PREFIXES,
    ["/api/admin/", "/admin/"],
    FEATURES
  );
}

/** Vendor route requirement resolver */
export function resolveVendorRouteRequirement(pathname: string, method = "GET"): RouteRequirement {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return resolveGenericRouteRequirement(
    clean,
    method,
    VENDOR_OPEN_PAGES,
    VENDOR_OPEN_API_PREFIXES,
    ["/api/vendor/", "/vendor/"],
    VENDOR_FEATURES
  );
}

/** Ads Seller route requirement resolver */
export function resolveAdsSellerRouteRequirement(pathname: string, method = "GET"): RouteRequirement {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return resolveGenericRouteRequirement(
    clean,
    method,
    ADS_SELLER_OPEN_PAGES,
    ADS_SELLER_OPEN_API_PREFIXES,
    ["/api/ads-seller/", "/api/ads/seller/", "/ads-seller/"],
    ADS_SELLER_FEATURES
  );
}

/** Permission satisfaction check for Admin */
export function hasRoutePermission(
  permissions: string[],
  isSuper: boolean,
  requirement: RouteRequirement
): boolean {
  if (isSuper) return true;
  if (requirement.type === "open") return true;
  if (requirement.type === "super") return false;
  return permissions.includes(requirement.permission);
}

/** Permission satisfaction check for Vendor / Ads Seller Store */
export function hasStoreRoutePermission(
  permissions: string[],
  isOwner: boolean,
  requirement: RouteRequirement
): boolean {
  if (isOwner) return true;
  if (requirement.type === "open") return true;
  if (requirement.type === "super") return false;
  return permissions.includes(requirement.permission);
}

export interface AdminAccessInfo {
  isSuper: boolean;
  isActive: boolean;
  permissions: string[];
  roleId?: string | null;
  roleName?: string | null;
}

export interface StoreAccessInfo {
  isOwner: boolean;
  isActive: boolean;
  permissions: string[];
  roleId?: string | null;
  roleName?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  scope: "VENDOR" | "ADS_SELLER";
}
