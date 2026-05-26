/**
 * NotificationItem Component
 * Single notification display with click-to-read and navigation
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Check } from "lucide-react";
import type { Notification } from "@prisma/client";
import { NotificationType } from "@/types/notification";
import { NotificationIcon } from "./NotificationIcon";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick();
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors",
        "hover:bg-gray-50 border-b border-gray-100 last:border-0",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon type={notification.type as NotificationType} className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className={cn(
              "text-sm font-medium text-gray-900 truncate",
              !notification.isRead && "font-semibold"
            )}
          >
            {notification.title}
          </h4>

          {/* Unread indicator: blue dot → checkmark button on row hover */}
          {!notification.isRead && (
            <button
              onClick={handleMarkAsRead}
              title="Mark as read"
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-5 h-5 mt-0.5 rounded-full transition-all",
                isHovered
                  ? "bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-600"
                  : ""
              )}
            >
              {isHovered ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
          {notification.message}
        </p>

        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
