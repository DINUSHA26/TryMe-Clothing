/**
 * Admin RBAC permission catalog.
 *
 * IMPORTANT: this file must stay free of Node / Prisma imports because it is used
 * by the Edge middleware AND by client components.
 *
 * Permission string format: "<feature>.<action>"  e.g. "orders.edit"
 *
 * A Super Admin (ADMIN user without a StaffMember record) bypasses all checks.
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
  /** Path segments below /admin and /api/admin that belong to this feature */
  paths: string[];
  actions: PermissionAction[];
}

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
  { key: "chat", group: "Communication", label: "Chat Oversight", description: "Monitor customer / vendor chats", paths: ["chat"], actions: ["view"] },
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

/** Every valid permission string */
export const ALL_PERMISSIONS: string[] = FEATURES.flatMap((f) =>
  f.actions.map((a) => `${f.key}.${a}`)
);

export function isValidPermission(p: string): boolean {
  return ALL_PERMISSIONS.includes(p);
}

/**
 * Drop unknown permissions and make sure any non-"view" permission also includes "view".
 */
export function normalizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<string>();
  for (const p of input) {
    if (typeof p === "string" && isValidPermission(p)) set.add(p);
  }
  for (const p of Array.from(set)) {
    const [feature] = splitPermission(p);
    const viewKey = `${feature}.view`;
    if (isValidPermission(viewKey)) set.add(viewKey);
  }
  return Array.from(set).sort();
}

export function splitPermission(p: string): [string, string] {
  const idx = p.lastIndexOf(".");
  return [p.slice(0, idx), p.slice(idx + 1)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Route → permission resolution (used by middleware + sidebar)
// ─────────────────────────────────────────────────────────────────────────────

/** Paths every authenticated admin (including staff) may open */
const OPEN_PAGES = ["/admin", "/admin/change-password", "/admin/login"];
const OPEN_API_PREFIXES = ["/api/admin/access"];

/** Words in the last URL segment that mark an "approve" style action */
const APPROVE_RE = /(approve|reject|verify|confirm|resolve|release)/i;

export type RouteRequirement =
  | { type: "open" }
  | { type: "super" } // unmapped admin routes: Super Admin only (safe default)
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

/**
 * Work out which permission a request needs.
 * @param pathname e.g. "/api/admin/orders/123/status" or "/admin/vendors"
 */
export function resolveRouteRequirement(pathname: string, method = "GET"): RouteRequirement {
  const clean = pathname.replace(/\/+$/, "") || "/";

  if (OPEN_PAGES.includes(clean)) return { type: "open" };
  if (OPEN_API_PREFIXES.some((p) => clean === p || clean.startsWith(p + "/"))) return { type: "open" };

  let base: string | null = null;
  if (clean.startsWith("/api/admin/")) base = "/api/admin/";
  else if (clean.startsWith("/admin/")) base = "/admin/";
  if (!base) return { type: "super" };

  const segments = clean.slice(base.length).split("/").filter(Boolean);
  if (segments.length === 0) return { type: "open" };

  // Longest matching path wins (so "services/categories" beats "services")
  let best: { feature: FeatureDef; len: number } | null = null;
  for (const feature of FEATURES) {
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
  // If the feature doesn't expose this action, fall back to "edit" then "view"
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

/** Is the given permission list enough to satisfy a route requirement? */
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

export interface AdminAccessInfo {
  isSuper: boolean;
  isActive: boolean;
  permissions: string[];
  roleId?: string | null;
  roleName?: string | null;
}

