"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "../shared/Logo";
import { ThemeToggle } from "../shared/ThemeToggle";
import { WishlistButton } from "./WishlistButton";
import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ChatButton } from "@/components/chat/ChatButton";
import { useAuthStore } from "@/stores/authStore";

interface StorefrontHeaderProps {
  onMobileMenuToggle: () => void;
}

export function StorefrontHeader({ onMobileMenuToggle }: StorefrontHeaderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-1 sm:gap-2 md:gap-4 px-2 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Logo variant="icon" size="lg" href="/" className="shrink-0 hidden sm:flex mr-4" />
        <Logo variant="icon" size="mobile" href="/" className="shrink-0 sm:hidden mr-1" />

        {/* Search Bar (Desktop only) */}
        <form
          onSubmit={handleSearch}
          className="flex-1 relative min-w-[200px] hidden sm:block"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 w-full bg-muted/50 border border-[#FF6600] focus-visible:ring-1 focus-visible:ring-[#FF6600] focus-visible:border-[#FF6600] text-sm"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 ml-auto shrink-0 flex-nowrap py-1">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-10 sm:w-10" asChild aria-label="Social">
            <Link href="/social">
              <Globe className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {/* Notification only on desktop and only for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 md:gap-2">
              <ChatButton className="h-8 w-8 sm:h-10 sm:w-10" />
              <div className="hidden md:flex">
                <NotificationDropdown />
              </div>
            </div>
          )}
          <WishlistButton />
          <CartButton />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search Row (Mobile only) */}
      <div className="px-4 pb-3 sm:hidden pt-1 bg-background/95">
        <form
          onSubmit={handleSearch}
          className="relative w-full"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 w-full bg-muted/50 border border-[#FF6600] focus-visible:ring-1 focus-visible:ring-[#FF6600] focus-visible:border-[#FF6600] text-sm"
          />
        </form>
      </div>
    </header>
  );
}
