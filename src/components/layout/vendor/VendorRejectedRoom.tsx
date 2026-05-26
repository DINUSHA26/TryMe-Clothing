"use client";

import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Store, AlertOctagon, ExternalLink, LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";

export function VendorRejectedRoom() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-red-100/50 border border-red-100 overflow-hidden">
        <div className="bg-red-600 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{user?.vendor?.businessName || "Your Shop"}</h2>
              <p className="text-red-100 text-xs mt-1">Status: Account Suspended / Rejected</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()}
            className="text-red-100 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertOctagon className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Access Restricted
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              We regret to inform you that your vendor account has been <strong>rejected</strong> or <strong>suspended</strong> by our administrative team. 
              You no longer have access to the Vendor Dashboard and selling features.
            </p>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-left w-full mb-8">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-red-900">What does this mean?</h3>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    While you cannot sell products, you can still use your account as a regular customer to browse and purchase items from other vendors.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button asChild className="flex-1 bg-gray-900 hover:bg-gray-800">
                <Link href="/">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse as Customer
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/contact">
                  Appeal Decision
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Account Status: INACTIVE • If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
