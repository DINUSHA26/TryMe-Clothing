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
import { useAdsSellerAccess } from "@/hooks/useAdsSellerAccess";
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
  const { canAccessPath, roleName, isOwner, can } = useAdsSellerAccess();

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
    if (!isOwner && !can("wallet.view") && !canAccessPath("/ads-seller/wallet")) {
      return;
    }
    fetch("/api/ads-seller/wallet")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data?.balance) {
          setAvailableBalance(result.data.balance.availableBalance);
        }
      })
      .catch(() => {/* silently ignore */ });
  }, [isOwner, can, canAccessPath]);

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
        "flex flex-col h-screen transition-all duration-300",
        "bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F4EFE6] dark:from-[#18223c] dark:via-[#121a2f] dark:to-[#0d1324]",
        "border-r border-[#EAE4D9] dark:border-[#223052] shadow-xs",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Logo variant="icon" href="/ads-seller" className={cn(isCollapsed && "mx-auto")} size={isCollapsed ? "sm" : "md"} />
      </div>

      <Separator className="bg-[#EAE4D9] dark:bg-[#223052]" />

      {/* Seller Status */}
      {!isCollapsed && (
        <div className="mx-3 my-2 px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-[#18223c]/90 border border-[#EAE4D9] dark:border-[#283960] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone className="w-4 h-4 text-[#FF6600] shrink-0" />
              <span className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{sellerName}</span>
            </div>
            <Badge
              variant={isShopOpen ? "default" : "secondary"}
              className={cn(
                "text-xs font-semibold shrink-0",
                isShopOpen
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
              {isShopOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          {isOwner || can("wallet.view") || canAccessPath("/ads-seller/wallet") ? (
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Available: {availableBalance === null ? "..." : `Rs. ${availableBalance.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">
                {roleName || "Store Staff"}
              </span>
            </div>
          )}
        </div>
      )}

      <Separator className="bg-[#EAE4D9] dark:bg-[#223052]" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-1">
            {/* Ads Seller Main Nav Items */}
            {adsSellerNavItems
              .filter((item) => canAccessPath(item.href))
              .map((item) => {
                const isItemActive = isActive(item.href, item.href === "/ads-seller");
                return renderNavLink(item, isItemActive);
              })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <Separator className="bg-[#EAE4D9] dark:bg-[#223052]" />

      {/* Footer Info */}
      <div className="p-4 space-y-3">
        {!isCollapsed && user && (
          <div className="px-3 py-2 bg-white/70 dark:bg-[#18223c]/90 border border-[#EAE4D9] dark:border-[#283960] rounded-xl shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                {user.firstName || "Ads Seller"}
              </p>
              <Badge variant={isOwner ? "default" : "outline"} className="text-[10px] px-1.5 py-0 shrink-0">
                {roleName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
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
