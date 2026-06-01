"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Store as StoreIcon, ShoppingBag, AlertTriangle, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Logo } from "../shared/Logo";
import { vendorNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface VendorMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorMobileNav({ isOpen, onClose }: VendorMobileNavProps) {
  const pathname = usePathname();
  const { isActive } = useActiveRoute();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Mock data - will be replaced with real data in Phase 4+
  const mockShopName = "My Store";
  const mockShopStatus = "Open";
  const mockWalletBalance = "Rs. 45,230.00";

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
        <SheetHeader className="p-4 text-left">
          <SheetTitle>
            <Logo variant="icon" href="/vendor" />
          </SheetTitle>
        </SheetHeader>

        <Separator />

        {/* Shop Status */}
        <div className="px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4" />
              <span className="text-sm font-medium truncate">{mockShopName}</span>
            </div>
            <Badge variant={mockShopStatus === "Open" ? "default" : "secondary"} className="text-xs">
              {mockShopStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Available: {mockWalletBalance}
          </p>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {vendorNavItems.map((item) => {
              const isItemActive = isActive(item.href, item.href === "/vendor");

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
                  {item.badge && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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
              {
                label: "My Disputes",
                href: "/my-disputes",
                icon: AlertTriangle,
              },
              { label: "Settings", href: "/vendor/settings", icon: Settings },
            ].map((item) => {
              const isItemActive = isActive(item.href);

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
          </nav>
        </ScrollArea>

        <Separator />

        {/* User Info */}
        <div className="p-4 space-y-3">
          {user && (
            <div className="px-3 py-2 bg-accent rounded-lg">
              <p className="text-sm font-medium truncate">
                {user.firstName || "Vendor"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full justify-start"
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
