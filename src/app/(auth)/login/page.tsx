"use client";

import { Suspense } from "react";
import Link from "next/link";
import { OTPForm } from "@/components/auth/OTPForm";
import { Logo } from "@/components/layout/shared/Logo";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

function CustomerLoginContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Store
        </Link>

        {/* Logo/Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo variant="icon" size="lg" className="mb-4" />
          <h1 className="text-3xl font-bold text-[#FF6600] mb-2">
            Welcome to TryMe
          </h1>
          <p className="text-gray-600">Sign in with your email or phone</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <OTPForm redirectUrl={returnUrl} />

          {/* How it works */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              How it works:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Enter your email address or phone number</li>
              <li>We&apos;ll send you a 6-digit code</li>
              <li>Enter the code to sign in</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              No password required! 🎉
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Are you a staff member?{" "}
                <Link
                  href="/staff/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Staff Login
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Want to sell with us?{" "}
                <Link
                  href="/vendor/register"
                  className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  Become a Vendor
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Want to post classified ads?{" "}
                <Link
                  href="/ads-seller/register"
                  className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  Become an Ads Seller
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure login · No password needed · Email or phone verification
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50" />
      }
    >
      <CustomerLoginContent />
    </Suspense>
  );
}
