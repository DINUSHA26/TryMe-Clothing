"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { VendorSidebar } from "@/components/layout/vendor/VendorSidebar";
import { VendorHeader } from "@/components/layout/vendor/VendorHeader";
import { VendorMobileNav } from "@/components/layout/vendor/VendorMobileNav";
import { VendorWaitingRoom } from "@/components/layout/vendor/VendorWaitingRoom";
import { VendorRejectedRoom } from "@/components/layout/vendor/VendorRejectedRoom";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { ChatInitializer } from "@/components/chat/ChatInitializer";

export default function VendorDashboardLayout({
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

    if (!isAuthenticated || user?.role !== "VENDOR") {
      router.push("/staff/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Show nothing while hydrating
  if (!_hasHydrated) {
    return null;
  }

  // If not authenticated or not a vendor, show nothing (useEffect handles redirect)
  if (!isAuthenticated || user?.role !== "VENDOR") {
    return null;
  }

  // If vendor is pending, show waiting room
  if (user?.vendor?.status === "PENDING") {
    return <VendorWaitingRoom />;
  }

  // If vendor is inactive (rejected/suspended), show rejected room
  if (user?.vendor?.status === "INACTIVE") {
    return <VendorRejectedRoom />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Real-time chat initialization */}
      <ChatInitializer />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <VendorSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <VendorMobileNav
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <VendorHeader
          onMobileMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Chat Dialog — rendered once at layout level */}
      <ChatDialog />
    </div>
  );
}
