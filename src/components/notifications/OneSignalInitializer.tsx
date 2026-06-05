"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export function OneSignalInitializer() {
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (typeof window === "undefined" || !_hasHydrated) return;

    // Initialize OneSignalDeferred array if not present
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Load OneSignal Web SDK Script if not already loaded
    if (!document.getElementById("onesignal-sdk")) {
      const script = document.createElement("script");
      script.id = "onesignal-sdk";
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }

    // Register configuration and login sync
    window.OneSignalDeferred.push(async (OneSignal: any) => {

      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "b6ab590e-bf4d-4545-8097-c3e4a4922410",
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          notifyButton: {
            enable: false, // Keep disabled since PrimeWear has its own notification badge & bell
          },
        });

        // Sync authenticated user state with OneSignal
        if (user?.id) {
          console.log(`[OneSignal] Logging in external user: ${user.id}`);
          await OneSignal.login(user.id);
        } else {
          console.log("[OneSignal] Logging out external user");
          await OneSignal.logout();
        }
      } catch (err) {
        console.error("[OneSignal] Initialization failed:", err);
      }
    });
  }, [user, _hasHydrated]);

  return null;
}
