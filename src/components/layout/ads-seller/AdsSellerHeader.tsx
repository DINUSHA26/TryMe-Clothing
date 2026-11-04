"use client";

import { Menu, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "../shared/ThemeToggle";
import { NotificationBell } from "../shared/NotificationBell";
import { ChatButton } from "@/components/chat/ChatButton";
import { Breadcrumbs } from "../admin/Breadcrumbs";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AdsSellerHeaderProps {
  onMobileMenuToggle: () => void;
}

export function AdsSellerHeader({ onMobileMenuToggle }: AdsSellerHeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/staff/login");
  };

  const userInitials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "A";

  const businessName = user?.adsSeller?.businessName || `${user?.firstName}'s Store`;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex-1 hidden md:block">
        <Breadcrumbs />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Badge variant="outline" className="hidden sm:inline-flex text-[#FF6600] border-[#FF6600]/30 bg-[#FF6600]/5 mr-2">
          Classifieds Portal
        </Badge>
        
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40 relative"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("toggle-store-ai"));
          }}
          title="Store AI Assistant"
          aria-label="Store AI Assistant"
        >
          <Bot className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
        </Button>
        <ChatButton />
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarFallback className="bg-[#FF6600] text-white font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{businessName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/ads-seller/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
