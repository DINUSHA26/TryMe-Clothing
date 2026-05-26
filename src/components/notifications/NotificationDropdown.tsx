/**
 * NotificationDropdown Component
 * Dropdown list of recent notifications with mark all as read
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore, useNotificationListeners } from "@/stores/notificationStore";
import { NotificationBell } from "./NotificationBell";
import { NotificationItem } from "./NotificationItem";
import { EmptyNotifications } from "./EmptyNotifications";
import { Button } from "@/components/ui/button";
import { Check, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Initialize Pusher listeners
  useNotificationListeners();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  // Get recent 10 notifications
  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/notifications");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] max-w-[calc(100vw-2rem)] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="h-8 px-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : recentNotifications.length > 0 ? (
            <>
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onClick={() => setIsOpen(false)}
                />
              ))}

              {/* View all footer */}
              {notifications.length > 10 && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleViewAll}
                    className="w-full px-4 py-3 text-sm text-center text-blue-600 hover:bg-gray-50 font-medium transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyNotifications />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
