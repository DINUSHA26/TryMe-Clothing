"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/shared/Logo";
import {
  Store,
  Megaphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  Tag,
  Star,
  Globe,
  ScanBarcode,
  Truck,
  MessageCircle,
  PhoneCall,
  BadgeCheck,
} from "lucide-react";

export default function StaffRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-blue-50/40 px-4 py-8 md:py-12 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-[#FF6600] hover:underline"
          >
            Go to Marketplace
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6600]" />
            TryMe Partner & Seller Registration
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Choose Your Seller Account
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Join thousands of merchants and classified advertisers growing their business across Sri Lanka.
            Select the account type that matches your business model.
          </p>
        </div>

        {/* Two Choice Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">
          {/* ── CARD 1: E-commerce Vendor ── */}
          <div className="bg-white rounded-3xl border-2 border-orange-200/80 hover:border-[#FF6600] p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group">
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-6 bg-[#FF6600] text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Online Retail & Brands
            </div>

            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mt-2 mb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Vendor Registration
                  </h2>
                  <p className="text-sm font-medium text-[#FF6600] mt-0.5">
                    For Retailers, Boutiques, Brands & Manufacturers
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF6600] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Store className="w-7 h-7" />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Sell physical products directly on the TryMe multi-vendor marketplace with secure escrow checkout, 
                automated orders, and get your own branded storefront website.
              </p>

              {/* Feature Points */}
              <div className="border-t border-b border-orange-100 py-5 space-y-3.5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">TryMe Marketplace Listing:</span>{" "}
                    <span className="text-xs text-gray-600">List clothing, electronics, jewelry & accessories visible to all customers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Custom Standalone Website:</span>{" "}
                    <span className="text-xs text-gray-600">Build your own branded e-commerce store with custom domain support.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Order & Fulfillment Center:</span>{" "}
                    <span className="text-xs text-gray-600">Manage orders, bank slip approvals, COD, and tracking status.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Digital Wallet & Bank Payouts:</span>{" "}
                    <span className="text-xs text-gray-600">Escrow payment safety with direct bank withdrawal requests.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Coupons & Flash Discounts:</span>{" "}
                    <span className="text-xs text-gray-600">Run marketing promos, coupon codes, and promotional discounts.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">In-Store POS System:</span>{" "}
                    <span className="text-xs text-gray-600">Barcode scanner, fast cashier checkout & receipt printing for physical outlets.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Verified Reviews & Ratings:</span>{" "}
                    <span className="text-xs text-gray-600">Collect verified customer reviews to rank higher in marketplace searches.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div>
              <Link
                href="/vendor/register"
                className="w-full py-4 px-6 rounded-2xl bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold text-center flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 text-base group/btn"
              >
                <span>Register as Vendor</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
              <p className="text-center text-xs text-gray-500 mt-2.5">
                Instant setup · Free basic store profile
              </p>
            </div>
          </div>

          {/* ── CARD 2: Ads Seller ── */}
          <div className="bg-white rounded-3xl border-2 border-blue-200/80 hover:border-blue-600 p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group">
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-6 bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              Classifieds & Services
            </div>

            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mt-2 mb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Ads Seller Registration
                  </h2>
                  <p className="text-sm font-medium text-blue-600 mt-0.5">
                    For Classified Advertisers, Dealers & Local Service Providers
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Megaphone className="w-7 h-7" />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Post high-converting classified listings in vehicles, property, electronics, services & more. 
                Receive direct inquiries from interested buyers via WhatsApp, Phone, and Chat.
              </p>

              {/* Feature Points */}
              <div className="border-t border-b border-blue-100 py-5 space-y-3.5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Classifieds Across All Categories:</span>{" "}
                    <span className="text-xs text-gray-600">Post ads in Mobiles, Vehicles, Property, Animals, Services & Essentials.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Direct Inquiries & Buyer Leads:</span>{" "}
                    <span className="text-xs text-gray-600">One-click WhatsApp chats, verified phone calls, and direct live messages.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Orders & Bank Slip Verification:</span>{" "}
                    <span className="text-xs text-gray-600">Accept and fulfill direct orders, inquiry leads, and bank payment slips.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Integrated Storefront & POS:</span>{" "}
                    <span className="text-xs text-gray-600">Full POS system to record in-person customer transactions & receipts.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Coupons & Wallet Management:</span>{" "}
                    <span className="text-xs text-gray-600">Create promotional discount coupons and track payments in your wallet.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Priority Ad Boosting:</span>{" "}
                    <span className="text-xs text-gray-600">Boost your listings to appear on the front page and top search results.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Verified Seller Credibility:</span>{" "}
                    <span className="text-xs text-gray-600">Verified phone and business badge to stand out from other advertisers.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div>
              <Link
                href="/ads-seller/register"
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300 text-base group/btn"
              >
                <span>Register as Ads Seller</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
              <p className="text-center text-xs text-gray-500 mt-2.5">
                Quick 2-minute registration · Start posting today
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm text-center max-w-xl mx-auto space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            Already have an approved account?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link
              href="/staff/login"
              className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Staff Login Portal</span>
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/vendor/login"
              className="text-[#FF6600] hover:text-orange-700 hover:underline flex items-center gap-1"
            >
              <span>Vendor Login</span>
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 hover:underline"
            >
              <span>Customer Login</span>
            </Link>
          </div>
        </div>

        {/* Security / Trust Badges */}
        <div className="mt-8 text-center text-xs text-gray-500 flex flex-wrap items-center justify-center gap-6">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Verified Sellers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[#FF6600]" />
            Island-wide Customer Reach
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" />
            Secure Digital Payouts
          </span>
        </div>
      </div>
    </div>
  );
}

