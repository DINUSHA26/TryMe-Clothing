import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
import type { NotificationCategory } from "@/types/notification";
import type { Notification } from "@prisma/client";
import { pusherClient } from "@/lib/pusher-client";
import { useAuthStore } from "@/stores/authStore";

interface NotificationFilters {
  category?: NotificationCategory;
  isRead?: boolean;
}

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchMore: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  reset: () => void;
  initializePusherListeners: (userId: string) => () => void;
}

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: false,
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch notifications from API
       */
      fetchNotifications: async (filters?: NotificationFilters) => {
        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: "1",
            pageSize: get().pageSize.toString(),
            ...(filters?.category && { category: filters.category }),
            ...(filters?.isRead !== undefined && {
              isRead: filters.isRead.toString(),
            }),
          });

          const response = await fetch(`/api/notifications?${params}`);

          if (!response.ok) {
            throw new Error("Failed to fetch notifications");
          }

          const data = await response.json();

          if (data.success) {
            set({
              notifications: data.data.notifications,
              unreadCount: data.data.unreadCount,
              total: data.data.total,
              page: 1,
              hasMore: data.data.notifications.length < data.data.total,
              isLoading: false,
            });
          } else {
            throw new Error(data.error || "Failed to fetch notifications");
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch notifications",
            isLoading: false,
          });
        }
      },

      /**
       * Fetch next page of notifications
       */
      fetchMore: async () => {
        const { page, pageSize, isLoading, hasMore } = get();

        if (isLoading || !hasMore) return;

        set({ isLoading: true });

        try {
          const nextPage = page + 1;
          const params = new URLSearchParams({
            page: nextPage.toString(),
            pageSize: pageSize.toString(),
          });

          const response = await fetch(`/api/notifications?${params}`);

          if (!response.ok) {
            throw new Error("Failed to fetch more notifications");
          }

          const data = await response.json();

          if (data.success) {
            set((state) => ({
              notifications: [
                ...state.notifications,
                ...data.data.notifications,
              ],
              page: nextPage,
              hasMore:
                state.notifications.length + data.data.notifications.length <
                data.data.total,
              isLoading: false,
            }));
          } else {
            throw new Error(data.error || "Failed to fetch more notifications");
          }
        } catch (error) {
          console.error("Error fetching more notifications:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch more notifications",
            isLoading: false,
          });
        }
      },

      /**
       * Add new notification (from Pusher or manual)
       * Automatically shows toast for HIGH/CRITICAL priority
       */
      addNotification: (notification: Notification) => {
        set((state) => {
          // Check if notification already exists (deduplicate)
          const exists = state.notifications.some(
            (n) => n.id === notification.id
          );

          if (exists) {
            return state;
          }

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead
              ? state.unreadCount
              : state.unreadCount + 1,
            total: state.total + 1,
          };
        });

        // Auto-show toast for HIGH/CRITICAL priority
        if (
          notification.priority === "HIGH" ||
          notification.priority === "CRITICAL"
        ) {
          window.dispatchEvent(
            new CustomEvent("show-notification-toast", {
              detail: notification,
            })
          );
        }
      },

      /**
       * Mark notification as read (optimistic update)
       */
      markAsRead: async (id: string) => {
        const { notifications, unreadCount } = get();

        // Find the notification
        const notification = notifications.find((n) => n.id === id);
        if (!notification || notification.isRead) return;

        // Optimistic update
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        try {
          // Update via API
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: "PATCH",
          });

          if (!response.ok) {
            throw new Error("Failed to mark notification as read");
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to mark notification as read");
          }
        } catch (error) {
          console.error("Error marking notification as read:", error);

          // Rollback on error
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
            error:
              error instanceof Error
                ? error.message
                : "Failed to mark notification as read",
          });
        }
      },

      /**
       * Mark all notifications as read (optimistic update)
       */
      markAllAsRead: async () => {
        const { notifications, unreadCount } = get();

        if (unreadCount === 0) return;

        // Optimistic update
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date(),
          })),
          unreadCount: 0,
        }));

        try {
          // Update via API
          const response = await fetch("/api/notifications/read-all", {
            method: "PATCH",
          });

          if (!response.ok) {
            throw new Error("Failed to mark all notifications as read");
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(
              data.error || "Failed to mark all notifications as read"
            );
          }
        } catch (error) {
          console.error("Error marking all notifications as read:", error);

          // Rollback on error
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
            error:
              error instanceof Error
                ? error.message
                : "Failed to mark all notifications as read",
          });
        }
      },

      /**
       * Set unread count
       */
      setUnreadCount: (count: number) => {
        set({ unreadCount: Math.max(0, count) });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },

      /**
       * Initialize Pusher event listeners
       */
      initializePusherListeners: (userId: string) => {
        const channelName = `private-user-${userId}`;
        const channel = pusherClient.subscribe(channelName);

        // Listen for new notifications
        channel.bind("new-notification", (data: { notification: Notification }) => {
          get().addNotification(data.notification);
        });

        // Listen for unread count updates
        channel.bind("unread-count-update", (data: { count: number }) => {
          get().setUnreadCount(data.count);
        });

        // Return cleanup function
        return () => {
          pusherClient.unsubscribe(channelName);
        };
      },
    }),
    { name: "NotificationStore" }
  )
);

/**
 * Hook to initialize Pusher listeners on mount
 */
export function useNotificationListeners() {
  const initializePusherListeners = useNotificationStore(
    (state) => state.initializePusherListeners
  );
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (userId) {
      const cleanup = initializePusherListeners(userId);
      return cleanup;
    }
  }, [userId, initializePusherListeners]);
}

