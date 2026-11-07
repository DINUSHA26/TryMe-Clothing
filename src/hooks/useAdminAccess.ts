"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AdminAccessInfo,
  hasRoutePermission,
  resolveRouteRequirement,
} from "@/lib/permissions";

let cached: AdminAccessInfo | null = null;
let inflight: Promise<AdminAccessInfo | null> | null = null;
const listeners = new Set<(a: AdminAccessInfo | null) => void>();

async function loadAccess(force = false): Promise<AdminAccessInfo | null> {
  if (cached && !force) return cached;
  if (inflight) return inflight;
  inflight = fetch("/api/admin/access/me", { credentials: "include" })
    .then((r) => r.json())
    .then((json) => {
      cached = json?.success ? (json.data as AdminAccessInfo) : null;
      listeners.forEach((l) => l(cached));
      return cached;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Admin RBAC state for the logged-in admin.
 *  - isSuper: full access (no staff role)
 *  - can("orders.edit"): permission check
 *  - canAccessPath("/admin/orders"): is the page reachable (used to filter the sidebar)
 */
export function useAdminAccess() {
  const [access, setAccess] = useState<AdminAccessInfo | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const listener = (a: AdminAccessInfo | null) => setAccess(a);
    listeners.add(listener);
    if (!cached) {
      loadAccess().then((a) => {
        setAccess(a);
        setLoading(false);
      });
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const can = useCallback(
    (permission: string) => {
      if (!access) return false;
      return access.isSuper || access.permissions.includes(permission);
    },
    [access]
  );

  const canAccessPath = useCallback(
    (href: string) => {
      // Non-admin links (e.g. the storefront) are always visible
      if (!href.startsWith("/admin")) return true;
      // While loading / on lookup failure show everything — the server enforces anyway
      if (!access) return true;
      return hasRoutePermission(access.permissions, access.isSuper, resolveRouteRequirement(href, "GET"));
    },
    [access]
  );

  const refresh = useCallback(async () => {
    const a = await loadAccess(true);
    setAccess(a);
  }, []);

  return {
    loading,
    access,
    isSuper: access?.isSuper ?? false,
    roleName: access?.roleName ?? null,
    can,
    canAccessPath,
    refresh,
  };
}

