"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ShoppingBag, LogOut, LogIn, Shield, Store, Bookmark } from "lucide-react";
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
import { useAuthStore } from "@/stores/authStore";

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Guest user
  if (!isAuthenticated || !user) {
    return (
      <>
        {/* Mobile: icon only to save header space */}
        <Button variant="default" size="icon" className="md:hidden" asChild>
          <Link href="/login" aria-label="Login">
            <LogIn className="w-4 h-4" />
          </Link>
        </Button>
        {/* Desktop: icon + text */}
        <Button variant="default" size="sm" className="hidden md:flex" asChild>
          <Link href="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Link>
        </Button>
      </>
    );
  }

  // Authenticated customer
  const userInitials = user.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user.firstName || "Customer"}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "VENDOR" && (
          <DropdownMenuItem asChild>
            <Link href="/vendor" className="cursor-pointer">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Vendor Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "CUSTOMER" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="cursor-pointer">
                <ShoppingBag className="w-4 h-4 mr-2" />
                My Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/followed-stores" className="cursor-pointer">
                <Store className="w-4 h-4 mr-2" />
                Followed stores
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/followed-stores?tab=saved" className="cursor-pointer">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved posts
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
