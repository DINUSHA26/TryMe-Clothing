"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
import { playNotificationChime } from "@/lib/utils/sound";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { toast } from "sonner";
import { Bell, ShoppingBag, UserPlus, Store, Megaphone, Globe, CreditCard, ExternalLink } from "lucide-react";

export interface AdminNotificationEvent {
  type:
    | "NEW_ORDER"
    | "NEW_CUSTOMER"
    | "NEW_VENDOR"
    | "NEW_ADS_SELLER"
    | "NEW_ADS_SUBSCRIPTION"
    | "NEW_WEBSITE_SUBSCRIPTION";
  title: string;
  message: string;
  link: string;
  data?: any;
  createdAt?: string;
}

export function AdminAlertListener() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Only subscribe for authenticated Admin users
    if (!isAuthenticated || user?.role !== "ADMIN") return;

    const channelName = "admin-alerts";
    const channel = pusherClient.subscribe(channelName);
    isSubscribedRef.current = true;

    const handleAdminAlert = (data: AdminNotificationEvent) => {
      // 1. Play pleasant crystal bell chime
      playNotificationChime();

      // 2. Increment unread notification badge count
      const currentUnread = useNotificationStore.getState().unreadCount;
      useNotificationStore.getState().setUnreadCount(currentUnread + 1);

      // 3. Resolve icon based on alert type
      let icon = <Bell className="w-5 h-5 text-amber-500" />;
      if (data.type === "NEW_ORDER") icon = <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      else if (data.type === "NEW_CUSTOMER") icon = <UserPlus className="w-5 h-5 text-blue-500" />;
      else if (data.type === "NEW_VENDOR") icon = <Store className="w-5 h-5 text-orange-500" />;
      else if (data.type === "NEW_ADS_SELLER") icon = <Megaphone className="w-5 h-5 text-purple-500" />;
      else if (data.type === "NEW_WEBSITE_SUBSCRIPTION") icon = <Globe className="w-5 h-5 text-indigo-500" />;
      else if (data.type === "NEW_ADS_SUBSCRIPTION") icon = <CreditCard className="w-5 h-5 text-pink-500" />;

      // 4. Show rich interactive Toast with 1-click navigation
      toast(data.title, {
        description: data.message,
        icon: icon,
        duration: 9000,
        action: {
          label: "View",
          onClick: () => {
            if (data.link) {
              router.push(data.link);
            }
          },
        },
      });
    };

    channel.bind("admin-notification", handleAdminAlert);

    return () => {
      if (isSubscribedRef.current) {
        channel.unbind("admin-notification", handleAdminAlert);
        pusherClient.unsubscribe(channelName);
        isSubscribedRef.current = false;
      }
    };
  }, [isAuthenticated, user?.role, router]);

  return null;
}
