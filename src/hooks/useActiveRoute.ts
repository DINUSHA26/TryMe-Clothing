"use client";

import { usePathname } from "next/navigation";

export function useActiveRoute() {
  const pathname = usePathname();

  /**
   * Check if a route is active
   * @param href - The route to check
   * @param exact - If true, only match exact paths. If false, match paths that start with href
   */
  const isActive = (href: string, exact: boolean = false): boolean => {
    if (exact) {
      return pathname === href;
    }
    // For non-exact matches, check if pathname starts with href
    // Special case: "/" should only match exactly
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return { pathname, isActive };
}
