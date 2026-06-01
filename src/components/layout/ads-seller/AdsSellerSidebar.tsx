"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Megaphone,
  ShoppingBag,
  AlertTriangle,
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

  const [subData, setSubData] = useState<{
    planName: string;
    maxAds: number;
    adsUsed: number;
  } | null>(null);

  const businessName = user?.adsSeller?.businessName || `${user?.firstName}'s Store`;
  const primaryCategory = user?.adsSeller?.primaryCategory || "Classifieds";

  useEffect(() => {
    fetch("/api/ads/seller/subscription")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setSubData({
            planName: result.data.planName,
            maxAds: result.data.maxAds,
            adsUsed: result.data.adsUsed,
          });
        }
      })
      .catch(() => {});
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

      {/* Subscription/Plan Status */}
      {!isCollapsed && (
        <div className="px-4 py-3 bg-[#FF6600]/5 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF6600] uppercase tracking-wider">
              {subData?.planName || "Free Plan"}
            </span>
            <Badge variant="outline" className="text-[10px] text-gray-500 bg-white">
              Seller
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {businessName}
          </p>
          {subData && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>Ads Posted</span>
                <span>{subData.adsUsed} / {subData.maxAds}</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF6600]"
                  style={{ width: `${Math.min((subData.adsUsed / subData.maxAds) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
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

            <div className="pt-4 pb-2 px-3">
              {!isCollapsed && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  My Shopping
                </span>
              )}
              <Separator className="mt-2 opacity-50" />
            </div>

            {/* Shopping sections */}
            {[
              { label: "My Orders", href: "/orders", icon: ShoppingBag },
              { label: "My Disputes", href: "/my-disputes", icon: AlertTriangle },
            ].map((item) => {
              const isItemActive = isActive(item.href);
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
