"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { AdminSidebar } from "@/components/layout/admin/AdminSidebar";
import { AdminHeader } from "@/components/layout/admin/AdminHeader";
import { AdminMobileNav } from "@/components/layout/admin/AdminMobileNav";
import { cn } from "@/lib/utils";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useLayoutStore();
  const isMobile = useIsMobile();

  const handleMobileMenuClose = useCallback(() => setMobileMenuOpen(false), [setMobileMenuOpen]);

  // Auth check - wait for hydration before redirecting
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/staff/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Show nothing while hydrating or checking auth
  if (!_hasHydrated || !isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <AdminMobileNav
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader
          onMobileMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
