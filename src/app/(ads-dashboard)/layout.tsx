"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { AdsSellerSidebar } from "@/components/layout/ads-seller/AdsSellerSidebar";
import { AdsSellerHeader } from "@/components/layout/ads-seller/AdsSellerHeader";
import { AdsSellerMobileNav } from "@/components/layout/ads-seller/AdsSellerMobileNav";
import { AdsSellerWaitingRoom } from "@/components/layout/ads-seller/AdsSellerWaitingRoom";
import { AdsSellerRejectedRoom } from "@/components/layout/ads-seller/AdsSellerRejectedRoom";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { ChatInitializer } from "@/components/chat/ChatInitializer";

export default function AdsSellerDashboardLayout({
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

    if (!isAuthenticated || user?.role !== "ADS_SELLER") {
      router.push("/staff/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Show nothing while hydrating
  if (!_hasHydrated) {
    return null;
  }

  // If not authenticated or not an ads seller, show nothing (useEffect handles redirect)
  if (!isAuthenticated || user?.role !== "ADS_SELLER") {
    return null;
  }

  // If ads seller is pending, show waiting room
  if (user?.adsSeller?.status === "PENDING") {
    return <AdsSellerWaitingRoom />;
  }

  // If ads seller is inactive (rejected/suspended), show rejected room
  if (user?.adsSeller?.status === "INACTIVE") {
    return <AdsSellerRejectedRoom />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Real-time chat initialization */}
      <ChatInitializer />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdsSellerSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <AdsSellerMobileNav
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdsSellerHeader
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
