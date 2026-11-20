"use client";

import { useEffect, useState, useCallback } from "react";
import {
  StoreAccessInfo,
  hasStoreRoutePermission,
  resolveVendorRouteRequirement,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/authStore";

let cached: StoreAccessInfo | null = null;
let inflight: Promise<StoreAccessInfo | null> | null = null;
const listeners = new Set<(a: StoreAccessInfo | null) => void>();

async function loadAccess(force = false): Promise<StoreAccessInfo | null> {
  if (cached && !force) return cached;
  if (inflight) return inflight;
  inflight = fetch("/api/vendor/access/me", { credentials: "include" })
    .then((r) => r.json())
    .then((json) => {
      const data = json?.data || json;
      cached = json?.success ? (data as StoreAccessInfo) : null;
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
  const { user } = useAuthStore();
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

  const isRoleOwner = user?.role === "VENDOR" || user?.role === "ADS_SELLER" || user?.role === "ADMIN";
  const effectiveIsOwner = access ? access.isOwner : isRoleOwner;

  const can = useCallback(
    (permission: string) => {
      if (effectiveIsOwner) return true;
      if (!access) return isRoleOwner;
      return access.isOwner || access.permissions.includes(permission) || access.permissions.includes("*");
    },
    [access, effectiveIsOwner, isRoleOwner]
  );

  const canAccessPath = useCallback(
    (pathname: string) => {
      if (effectiveIsOwner) return true;
      if (!access) return isRoleOwner;
      if (access.isOwner) return true;
      const req = resolveVendorRouteRequirement(pathname, "GET");
      return hasStoreRoutePermission(access.permissions, false, req);
    },
    [access, effectiveIsOwner, isRoleOwner]
  );

  const refresh = useCallback(() => loadAccess(true), []);

  return {
    access,
    loading,
    isOwner: effectiveIsOwner,
    isActive: access?.isActive ?? true,
    permissions: access?.permissions ?? (effectiveIsOwner ? ["*"] : []),
    roleName: access?.roleName ?? (effectiveIsOwner ? "Store Owner" : "Staff Member"),
    storeName: access?.storeName ?? "My Store",
    can,
    canAccessPath,
    refresh,
  };
}

