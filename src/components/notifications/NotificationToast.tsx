/**
 * NotificationToast Component
 * Toast notifications for HIGH/CRITICAL priority notifications
 * Auto-dismisses after 5 seconds
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Notification } from "@prisma/client";
import { NotificationIcon } from "./NotificationIcon";
import { cn } from "@/lib/utils";

interface ToastNotification extends Notification {
  id: string;
}

export function NotificationToast() {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Listen for custom event from notificationStore
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<Notification>;
      const notification = customEvent.detail;

      // Add toast
      setToasts((prev) => [...prev, notification]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notification.id));
      }, 5000);
    };

    window.addEventListener("show-notification-toast", handleShowToast);

    return () => {
      window.removeEventListener("show-notification-toast", handleShowToast);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClick = (notification: ToastNotification) => {
    handleDismiss(notification.id);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className={cn(
            "pointer-events-auto",
            "bg-white rounded-lg shadow-lg border border-gray-200",
            "p-4 cursor-pointer transition-all",
            "hover:shadow-xl hover:scale-[1.02]",
            "animate-in slide-in-from-right duration-300"
          )}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <NotificationIcon type={toast.type as any} className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                  {toast.title}
                </h4>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(toast.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">
                {toast.message}
              </p>

              {/* Priority indicator */}
              {toast.priority === "CRITICAL" && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                  Urgent
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                toast.priority === "CRITICAL" ? "bg-red-600" : "bg-blue-600",
                "animate-[shrink_5s_linear_forwards]"
              )}
              style={{
                animation: "shrink 5s linear forwards",
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
