"use client";

import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/shared/Logo";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

function StaffLoginContent() {
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl") || undefined;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-8">
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Staff Portal
                    </h1>
                    <p className="text-gray-600">Sign in to manage the platform</p>
                </div>

                {/* Login Card */}
                <div className="border bg-white rounded-2xl shadow-xl p-8 border-gray-100">
                    <LoginForm userType="staff" redirectUrl={returnUrl} />

                    {/* Footer Links */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600">
                                Are you a customer?{" "}
                                <Link
                                    href="/login"
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Customer Login
                                </Link>
                            </p>
                            <p className="text-sm text-gray-600">
                                Interested in selling?{" "}
                                <Link
                                    href="/vendor/register"
                                    className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                                >
                                    Become a Vendor
                                </Link>
                            </p>
                            <p className="text-sm text-gray-600">
                                Want to ads with us?{" "}
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
                        Secure staff access · Protected by encryption
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function StaffLoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50" />
            }
        >
            <StaffLoginContent />
        </Suspense>
    );
}

