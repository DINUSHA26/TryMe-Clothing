"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "../shared/Logo";
import { Clock, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

export function AdsSellerWaitingRoom() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-8">
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
          {/* Top orange line indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

          {/* Time / Pending icon */}
          <div className="w-20 h-20 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock className="h-10 w-10" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Account Under Review</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Hello <strong className="text-gray-800">{user?.firstName || "Ads Seller"}</strong>, thank you for registering!
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your seller application is currently being reviewed by our administrators to ensure it complies with TryMe marketplace guidelines.
            </p>
          </div>

          {/* Details list */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-3 text-gray-600">
            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-700">Notification Email</p>
                <p>We will email you at <strong className="text-gray-800">{user?.email}</strong> once your account is activated.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-700">Expected Timeframe</p>
                <p>Account verification usually takes <strong>1 - 2 business days</strong>.</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors shadow-lg shadow-orange-500/10"
            >
              Refresh Status
            </button>
            
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
          Need urgent assistance? Contact seller support at{" "}
          <a href="mailto:support@tryme.lk" className="text-orange-500 hover:underline">
            support@tryme.lk
          </a>
        </div>
      </div>
    </div>
  );
}
