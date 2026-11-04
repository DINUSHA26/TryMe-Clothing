"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Share2, PlusSquare, Smartphone, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install prompt for Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosGuide(true);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/40 p-5 shadow-sm dark:from-neutral-900 dark:via-neutral-900 dark:to-orange-950/20 dark:border-neutral-800">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left icon & text */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-2xl shadow-md border border-orange-200 dark:border-orange-600/40 bg-orange-600">
              <Image
                src="/icons/apple-touch-icon.png"
                alt="TryMe App Icon"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="font-bold text-base md:text-lg text-neutral-900 dark:text-neutral-100">
                Install TryMe App
              </h3>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                Official App
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              Shop faster and smoother directly from your home screen. Enjoy instant loading, offline access, and real-time updates.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          {isInstalled ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
              <Check className="h-4 w-4" />
              <span>App Installed ✓</span>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md shadow-orange-500/25 px-5 py-2.5 rounded-xl h-auto flex items-center gap-2 group transition-all"
            >
              <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              <span>{isIOS ? "Install on iPhone" : "Install App"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* iOS / Manual Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  How to Install TryMe App
                </h4>
                <p className="text-xs text-neutral-500">Quick steps to add TryMe to your home screen</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 shrink-0">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">1. Tap the Share Button</p>
                      <p className="text-xs text-neutral-500">Tap the Share icon at the bottom of your Safari browser.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 shrink-0">
                      <PlusSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">2. Select &quot;Add to Home Screen&quot;</p>
                      <p className="text-xs text-neutral-500">Scroll down and tap &quot;Add to Home Screen&quot;, then tap &quot;Add&quot; in the top right.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    On Chrome, Edge, or Android:
                  </p>
                  <p className="text-xs text-neutral-500">
                    Tap the browser menu (three dots) in the top-right corner and tap <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
