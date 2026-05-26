"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function ShopStatusToggle() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = user?.vendor?.isShopOpen ?? false;

  const handleToggle = async (newStatus: boolean) => {
    if (!user?.vendor) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShopOpen: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local auth store
        setUser({
          ...user,
          vendor: {
            ...user.vendor,
            isShopOpen: newStatus,
          },
        } as any);
        toast.success(`Shop is now ${newStatus ? "Open" : "Closed"}`);
      } else {
        toast.error(result.error || "Failed to update shop status");
      }
    } catch (error) {
      console.error("Shop toggle error:", error);
      toast.error("An error occurred while updating shop status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">Shop Status:</span>
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isLoading ? "Updating..." : isOpen ? "Open" : "Closed"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Shop Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleToggle(true)} disabled={isOpen || isLoading}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Open Shop</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggle(false)} disabled={!isOpen || isLoading}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>Close Shop</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {isOpen
            ? "Your shop is visible to customers"
            : "Your shop is hidden from customers"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
