"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for service worker updates periodically or on new page loads
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // A new version is available
                  console.log("[PWA] New version installed and ready.");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn("[PWA] Service worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
