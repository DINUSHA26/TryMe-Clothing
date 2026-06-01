"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "../shared/Logo";
import { AlertTriangle, LogOut } from "lucide-react";
import { toast } from "sonner";

export function AdsSellerRejectedRoom() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      toast.success("Logged out successfully");
      router.push("/staff/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Logo variant="icon" size="lg" className="mb-4" />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            TryMe Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-2">Ads Seller Dashboard Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100/80 space-y-6 relative overflow-hidden">
          {/* Top red line indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

          {/* Alert Icon */}
          <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="h-10 w-10" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 font-display">Account Inactive</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your Ads Seller account is currently <strong>deactivated</strong> or has been <strong>suspended</strong>.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              This could be due to a violation of our advertising guidelines, an unpaid balance, or a manual action by the platform administration.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <a
              href="mailto:support@tryme.lk?subject=Ads%20Seller%20Account%20Suspended"
              className="w-full py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors text-center block shadow-lg shadow-orange-500/10"
            >
              Contact Admin Support
            </a>
            
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-gray-400">
          TryMe Classifieds Support · Secure Session
        </div>
      </div>
    </div>
  );
}
