"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storefrontNavItems, customerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function StorefrontNav() {
  const pathname = usePathname();
  const { isActive } = useActiveRoute();
  const { isAuthenticated, user } = useAuthStore();

  const isStaffOrVendor =
    isAuthenticated &&
    (user?.role === "ADMIN" || user?.role === "VENDOR" || user?.role === "ADS_SELLER");

  let navItems = [...storefrontNavItems];

  if (isAuthenticated) {
    if (isStaffOrVendor) {
      // Staff & Vendors only see Notifications and their Dashboard (no personal shopping orders/disputes)
      navItems.push({ href: "/notifications", label: "Notifications", icon: null as any });

      if (user?.role === "ADMIN") {
        navItems.push({ href: "/admin", label: "Admin Dashboard", icon: null as any });
      } else if (user?.role === "VENDOR") {
        navItems.push({ href: "/vendor", label: "Vendor Dashboard", icon: null as any });
      } else if (user?.role === "ADS_SELLER") {
        navItems.push({ href: "/ads-seller", label: "Ads Seller Dashboard", icon: null as any });
      }
    } else {
      // Regular customers see personal items (My Orders, My Disputes, Notifications)
      navItems = [...navItems, ...customerNavItems];
    }
  }

  return (
    <nav className="hidden md:block border-b bg-[#FF6600]">
      <div className="container flex items-center justify-center space-x-8 h-12 px-4 md:px-6">
        {navItems.map((item) => {
          const isItemActive =
            item.href === "/products"
              ? pathname.startsWith("/products") || pathname.startsWith("/categories")
              : isActive(item.href, item.href === "/");

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
