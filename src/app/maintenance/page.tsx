import React from "react";
import Image from "next/image";
import { Wrench, Clock, ShieldCheck, Mail, Phone, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Under Maintenance | TryMe.lk",
  description: "We are currently under maintenance. We'll be back soon!",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6600]/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <main className="max-w-3xl w-full text-center z-10 space-y-8 py-10 px-4">
        {/* Brand Logo */}
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="relative w-44 h-14 sm:w-52 sm:h-16">
            <Image
              src="/logo.png"
              alt="TryMe Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Animated Badge Icon */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-[#FF6600]/30 text-[#FF6600] text-sm font-semibold shadow-lg backdrop-blur-md">
          <Wrench className="w-4 h-4 animate-bounce" />
          <span>Scheduled System Upgrades</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            We are currently <span className="text-[#FF6600]">under maintenance.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-medium max-w-2xl mx-auto">
            We&apos;ll be back soon!
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Our platform is undergoing scheduled maintenance to improve your shopping experience and introduce exciting new features. Thank you for your patience!
          </p>
        </div>

        {/* Info Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
          <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-[#FF6600]/10 text-[#FF6600]">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-white text-sm">Estimated Time</h2>
            <p className="text-xs text-slate-400">We expect to be back online very soon. Please check again shortly.</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-[#FF6600]/10 text-[#FF6600]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-white text-sm">Orders & Data</h2>
            <p className="text-xs text-slate-400">All your active orders, account data, and payments remain 100% secure.</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <div className="p-2.5 w-fit rounded-xl bg-[#FF6600]/10 text-[#FF6600]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-white text-sm">Need Urgent Help?</h2>
            <p className="text-xs text-slate-400">Our customer support team is active and ready to assist you via email.</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-slate-400">
          <a
            href="mailto:support@tryme.lk"
            className="flex items-center gap-2 hover:text-[#FF6600] transition-colors"
          >
            <Mail className="w-4 h-4 text-[#FF6600]" />
            <span>support@tryme.lk</span>
          </a>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#FF6600]" />
            <span>+94 77 000 0000</span>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="z-10 text-xs text-slate-500 mt-6">
        &copy; {new Date().getFullYear()} TryMe.lk. All rights reserved.
      </footer>
    </div>
  );
}
