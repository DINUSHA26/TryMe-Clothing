import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole } from "@prisma/client";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  mustChangePassword: boolean;
  vendor?: {
    id: string;
    status: string;
    businessName: string;
    isShopOpen: boolean;
  } | null;
  adsSeller?: {
    id: string;
    status: string;
    slug: string;
    primaryCategory: string;
    businessName?: string | null;
  } | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),

      updateTokens: (accessToken, refreshToken) =>
        set((state) => ({
          ...state,
          accessToken,
          refreshToken,
        })),

      logout: async () => {
        try {
          // Call logout API to clear cookies
          await fetch("/api/auth/logout", {
            method: "POST",
          });
        } catch (error) {
          console.error("Logout API error:", error);
          // Continue with logout even if API call fails
        }

        // Clear local state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
