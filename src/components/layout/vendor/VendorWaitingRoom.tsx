"use client";

import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Store, Clock, ExternalLink, LogOut, Mail } from "lucide-react";
import Link from "next/link";

export function VendorWaitingRoom() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{user?.vendor?.businessName || "Your Shop"}</h2>
              <p className="text-gray-400 text-xs mt-1">Status: Pending Verification</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Your application is under review
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Welcome to the Try Me family! We've received your registration details. 
              Our admin team is currently verifying your business information. 
              This typically takes <strong>24-48 hours</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                <Mail className="w-5 h-5 text-gray-400 mb-2" />
                <h3 className="font-semibold text-sm text-gray-900">Email Notification</h3>
                <p className="text-xs text-gray-500 mt-1">We'll email you at {user?.email} once approved.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                <Store className="w-5 h-5 text-gray-400 mb-2" />
                <h3 className="font-semibold text-sm text-gray-900">Store Setup</h3>
                <p className="text-xs text-gray-500 mt-1">You'll gain access to the dashboard to list products.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button asChild className="flex-1 bg-gray-900 hover:bg-gray-800">
                <Link href="/">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse Storefront
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/contact">
                  Support Team
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Reference ID: {user?.vendor?.id?.substring(0, 8).toUpperCase()} • Registered on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
