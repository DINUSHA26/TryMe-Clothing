import { Suspense } from "react";
import { Metadata } from "next";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { Store, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Change Password - Ads Seller - Try Me",
  description: "Change your ads seller account password",
};

function AdsSellerChangePasswordContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6600] to-purple-600 rounded-2xl mb-4 shadow-lg shadow-orange-100">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Change Password
          </h1>
          <p className="text-gray-600">Update your Ads Seller account password</p>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <PasswordChangeForm redirectUrl="/ads-seller" isRequired={true} />
        </div>

        {/* Security Info */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Store className="w-4 h-4 text-[#FF6600]" />
            <span>Your password is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdsSellerChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdsSellerChangePasswordContent />
    </Suspense>
  );
}
