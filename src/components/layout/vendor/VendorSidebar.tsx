"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store as StoreIcon,
  ShoppingBag,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../shared/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { vendorNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";

interface VendorSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function VendorSidebar({
  isCollapsed,
  onToggleCollapse,
}: VendorSidebarProps) {
  const { isActive } = useActiveRoute();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const router = useRouter();

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const shopName = user?.vendor?.businessName || "My Store";
  const isShopOpen = user?.vendor?.isShopOpen ?? false;

  useEffect(() => {
    fetch("/api/vendor/wallet")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setAvailableBalance(result.data.balance.availableBalance);
        }
      })
      .catch(() => {/* silently ignore */ });
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/staff/login");
  };

  const renderNavLink = (item: any, isItemActive: boolean) => {
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          isItemActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
        {!isCollapsed && item.badge && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {!isCollapsed && item.href === "/vendor/notifications" && unreadCount > 0 && (
          <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full px-1.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        {isCollapsed ? (
          <Logo variant="icon" className="mx-auto" />
        ) : (
          <Logo variant="full" href="/vendor" />
        )}
      </div>

      <Separator />

      {/* Shop Status */}
      {!isCollapsed && (
        <div className="px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4" />
              <span className="text-sm font-medium truncate">{shopName}</span>
            </div>
            <Badge variant={isShopOpen ? "default" : "secondary"} className="text-xs">
              {isShopOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Available: {availableBalance === null ? "..." : `Rs. ${availableBalance.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      )}

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-1">
            {/* Vendor Management Sections */}
            {vendorNavItems.map((item) => {
              const isItemActive = isActive(item.href, item.href === "/vendor");
              return renderNavLink(item, isItemActive);
            })}

            <div className="pt-4 pb-2 px-3">
              {!isCollapsed && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  My Shopping
                </span>
              )}
              <Separator className="mt-2 opacity-50" />
            </div>

            {/* Personal Sections for Vendor as a Customer */}
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
              return renderNavLink(item, isItemActive);
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <Separator />

      {/* User Info & Collapse Button */}
      <div className="p-4 space-y-3">
        {!isCollapsed && user && (
          <div className="px-3 py-2 bg-accent rounded-lg">
            <p className="text-sm font-medium truncate">
              {user.firstName || "Vendor"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className={cn("shrink-0", isCollapsed && "mx-auto")}
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="ml-auto"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
