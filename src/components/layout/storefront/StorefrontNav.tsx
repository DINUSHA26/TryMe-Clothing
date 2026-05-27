"use client";

import Link from "next/link";
import { storefrontNavItems, customerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { CategoryMegaMenu } from "./CategoryMegaMenu";

export function StorefrontNav() {
  const { isActive } = useActiveRoute();
  const { isAuthenticated, user } = useAuthStore();

  // Show customer nav items for all authenticated users (so staff see customer features too)
  const showCustomerNav = isAuthenticated;
  let navItems = showCustomerNav
    ? [...storefrontNavItems, ...customerNavItems]
    : [...storefrontNavItems];

  if (isAuthenticated && user?.role === "ADMIN") {
    navItems.push({ href: "/admin", label: "Admin Dashboard", icon: null as any });
  } else if (isAuthenticated && user?.role === "VENDOR") {
    navItems.push({ href: "/vendor", label: "Vendor Dashboard", icon: null as any });
  }

  return (
    <nav className="hidden md:block border-b bg-[#FF6600]">
      <div className="container flex items-center justify-center space-x-8 h-12 px-4 md:px-6">
        {navItems.map((item) => {
          if (item.label === "Categories" && item.href === "/categories") {
            return <CategoryMegaMenu key={item.href} />;
          }

          const isItemActive = isActive(item.href, item.href === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white relative pb-3",
                isItemActive
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white font-semibold"
                  : "text-white/80"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
