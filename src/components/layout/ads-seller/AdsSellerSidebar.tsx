"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Megaphone,
  Settings,
  Store as StoreIcon,
  LayoutGrid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../shared/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { adsSellerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface AdsSellerSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdsSellerSidebar({
  isCollapsed,
  onToggleCollapse,
}: AdsSellerSidebarProps) {
  const { isActive } = useActiveRoute();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const sellerName =
    user?.adsSeller?.businessName ||
    (user as any)?.vendor?.businessName ||
    "My Store";
  const isShopOpen =
    user?.vendor?.isShopOpen ??
    (user as any)?.adsSeller?.isShopOpen ??
    true;

  useEffect(() => {
    fetch("/api/ads-seller/wallet")
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
            ? "bg-[#FF6600] text-white"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
        {!isCollapsed && item.badge && (
          <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
            {item.badge}
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
        <Logo variant="icon" href="/ads-seller" className={cn(isCollapsed && "mx-auto")} size={isCollapsed ? "sm" : "md"} />
      </div>

      <Separator />

      {/* Seller Status */}
      {!isCollapsed && (
        <div className="px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#FF6600]" />
              <span className="text-sm font-medium truncate">{sellerName}</span>
            </div>
            <Badge
              variant={isShopOpen ? "default" : "secondary"}
              className={cn(
                "text-xs font-semibold",
                isShopOpen
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
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
            {/* Ads Seller Main Nav Items */}
            {adsSellerNavItems.map((item) => {
              const isItemActive = isActive(item.href, item.href === "/ads-seller");
              return renderNavLink(item, isItemActive);
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <Separator />

      {/* Footer Info */}
      <div className="p-4 space-y-3">
        {!isCollapsed && user && (
          <div className="px-3 py-2 bg-accent rounded-lg">
            <p className="text-sm font-medium truncate">
              {user.firstName || "Ads Seller"}
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
