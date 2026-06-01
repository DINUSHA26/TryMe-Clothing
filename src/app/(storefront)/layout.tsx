"use client";

import { useCallback, useState } from "react";
import { StorefrontHeader } from "@/components/layout/storefront/StorefrontHeader";
import { StorefrontNav } from "@/components/layout/storefront/StorefrontNav";
import { StorefrontFooter } from "@/components/layout/storefront/StorefrontFooter";
import { MobileMenu } from "@/components/layout/storefront/MobileMenu";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { ChatInitializer } from "@/components/chat/ChatInitializer";
import { CartInitializer } from "@/components/cart/CartInitializer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuClose = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {/* Real-time chat initialization */}
      <ChatInitializer />
      
      {/* Auto-apply promo capture */}
      <CartInitializer />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      {/* Header */}
      <StorefrontHeader
        onMobileMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Navigation */}
      <StorefrontNav />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <StorefrontFooter />

      {/* Chat Dialog — rendered once at layout level */}
      <ChatDialog />
    </div>
  );
}
