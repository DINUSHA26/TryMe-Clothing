"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X, LogOut, LogIn, User, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "../shared/Logo";
import { ThemeToggle } from "../shared/ThemeToggle";
import { storefrontNavItems, customerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { isActive } = useActiveRoute();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openChat, rooms, isConnected } = useChatStore();
  const router = useRouter();

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleLogout = () => {
    logout();
    router.push("/");
    onClose();
  };

  const handleLogin = () => {
    router.push("/login");
    onClose();
  };

  // Show customer nav items for all authenticated users (so staff see customer features too)
  const showCustomerNav = isAuthenticated;
  let navItems = showCustomerNav
    ? [...storefrontNavItems, ...customerNavItems]
    : [...storefrontNavItems];

  if (isAuthenticated && user?.role === "ADMIN") {
    navItems.push({ href: "/admin", label: "Admin Dashboard", icon: User });
  } else if (isAuthenticated && user?.role === "VENDOR") {
    navItems.push({ href: "/vendor", label: "Vendor Dashboard", icon: User });
  } else if (isAuthenticated && user?.role === "ADS_SELLER") {
    navItems.push({ href: "/ads-seller", label: "Ads Seller Dashboard", icon: User });
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[85vw] max-w-[280px] p-0">
        <SheetHeader className="p-4 flex flex-row items-center justify-between space-y-0 text-left mt-2">
          <SheetTitle className="flex-1">
            <Logo variant="icon" href="/" />
          </SheetTitle>
          <div className="flex-none sm:hidden">
            <ThemeToggle />
          </div>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* User Section */}
        {isAuthenticated && user && (
          <>
            <div className="px-4 py-3 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6600] text-white flex items-center justify-center font-semibold">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName || "Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isItemActive = isActive(item.href, item.href === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isItemActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            {isAuthenticated && (
              <button
                onClick={() => {
                  openChat();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent text-left"
              >
                <div className="relative flex items-center justify-center">
                  <MessageCircle className={cn("w-5 h-5 shrink-0", isConnected ? "text-foreground" : "text-muted-foreground")} />
                  {rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0) > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0) > 99 ? '99+' : rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)}
                    </span>
                  )}
                  {!isConnected && (
                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive border-2 border-background" />
                  )}
                </div>
                <span className="text-sm font-medium">Chat</span>
              </button>
            )}
          </nav>
        </ScrollArea>

        <Separator />

        {/* Auth Actions */}
        <div className="p-4">
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          ) : (
            <Button
              variant="default"
              className="w-full justify-start bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200"
              onClick={handleLogin}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
