/**
 * EmptyNotifications Component
 * Empty state for notification list
 */

import { Bell } from "lucide-react";

interface EmptyNotificationsProps {
  message?: string;
}

export function EmptyNotifications({
  message = "No notifications yet",
}: EmptyNotificationsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{message}</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        When you receive notifications, they'll appear here.
      </p>
    </div>
  );
}
