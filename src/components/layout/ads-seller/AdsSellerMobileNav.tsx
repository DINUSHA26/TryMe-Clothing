"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ShoppingBag, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "../shared/Logo";
import { adsSellerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface AdsSellerMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdsSellerMobileNav({ isOpen, onClose }: AdsSellerMobileNavProps) {
  const pathname = usePathname();
  const { isActive } = useActiveRoute();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const businessName = user?.adsSeller?.businessName || `${user?.firstName}'s Store`;

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleLogout = () => {
    logout();
    router.push("/staff/login");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[85vw] max-w-[280px] p-0 flex flex-col h-full bg-white">
        <SheetHeader className="p-4 text-left border-b border-gray-100">
          <SheetTitle>
            <Logo variant="icon" href="/ads-seller" />
          </SheetTitle>
        </SheetHeader>

        {/* Store Title */}
        <div className="px-6 py-4 bg-gray-50/50">
          <p className="text-sm font-semibold text-gray-900 truncate">{businessName}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {adsSellerNavItems.map((item) => {
              const isItemActive = isActive(item.href, item.href === "/ads-seller");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isItemActive
                      ? "bg-[#FF6600] text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* My Shopping Section */}
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                My Shopping
              </span>
              <Separator className="mt-2 opacity-50" />
            </div>

            {[
              { label: "My Orders", href: "/orders", icon: ShoppingBag },
              { label: "My Disputes", href: "/my-disputes", icon: AlertTriangle },
            ].map((item) => {
              const isItemActive = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isItemActive
                      ? "bg-[#FF6600] text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* User Info */}
        <div className="p-4 space-y-3 bg-white mt-auto border-t border-gray-100">
          {user && (
            <div className="px-3 py-2 bg-accent rounded-lg">
              <p className="text-sm font-medium truncate">
                {user.firstName || "Ads Seller"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
