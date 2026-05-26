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
      <div className="container flex h-16 items-center gap-2 md:gap-4 px-2 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-10 w-10"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Logo variant="full" href="/" className="shrink-0 mr-auto md:mr-4 hidden sm:flex" />
        <Logo variant="icon" href="/" className="shrink-0 mr-auto sm:hidden" />

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 relative min-w-[70px]"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 w-full bg-muted/50 border-none focus-visible:ring-1 text-sm"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 ml-0 md:ml-auto order-2 md:order-none overflow-x-auto no-scrollbar py-1">
          <Button variant="ghost" size="icon" className="shrink-0" asChild aria-label="Social">
            <Link href="/social">
              <Globe className="h-5 w-5" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {/* Notification only on desktop and only for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 md:gap-2">
              <ChatButton />
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


    </header>
  );
}
