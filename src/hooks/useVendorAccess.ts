"use client";

import { useEffect, useState, useCallback } from "react";
import {
  StoreAccessInfo,
  hasStoreRoutePermission,
  resolveVendorRouteRequirement,
} from "@/lib/permissions";

let cached: StoreAccessInfo | null = null;
let inflight: Promise<StoreAccessInfo | null> | null = null;
const listeners = new Set<(a: StoreAccessInfo | null) => void>();

async function loadAccess(force = false): Promise<StoreAccessInfo | null> {
  if (cached && !force) return cached;
  if (inflight) return inflight;
  inflight = fetch("/api/vendor/access/me", { credentials: "include" })
    .then((r) => r.json())
    .then((json) => {
      cached = json?.success ? (json.data as StoreAccessInfo) : null;
      listeners.forEach((l) => l(cached));
      return cached;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useVendorAccess() {
  const [access, setAccess] = useState<StoreAccessInfo | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const listener = (a: StoreAccessInfo | null) => setAccess(a);
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
      return access.isOwner || access.permissions.includes(permission);
    },
    [access]
  );

  const canAccessPath = useCallback(
    (pathname: string) => {
      if (!access) return false;
      if (access.isOwner) return true;
      const req = resolveVendorRouteRequirement(pathname, "GET");
      return hasStoreRoutePermission(access.permissions, false, req);
    },
    [access]
  );

  const refresh = useCallback(() => loadAccess(true), []);

  return {
    access,
    loading,
    isOwner: access?.isOwner ?? false,
    isActive: access?.isActive ?? false,
    permissions: access?.permissions ?? [],
    roleName: access?.roleName ?? (access?.isOwner ? "Store Owner" : "Staff Member"),
    storeName: access?.storeName ?? "My Store",
    can,
    canAccessPath,
    refresh,
  };
}

