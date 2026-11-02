"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  MessageCircle,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Flame,
  Play,
  HeartHandshake,
  Tag,
} from "lucide-react";
import { HeroSectionConfig, HeroDesignStyle } from "@/types/website-builder";

interface HeroSectionClientProps {
  hero: HeroSectionConfig;
  vendor: any;
  primaryColor?: string;
  isMultiPage?: boolean;
  navigateTo?: (pageId: string) => void;
  handleInquiryViaWhatsApp?: () => void;
  openInquiryModal?: (item: any, type?: any) => void;
  products?: any[];
  categories?: string[];
}

export default function HeroSectionClient({
  hero,
  vendor,
  primaryColor = "#5c2336",
  isMultiPage = false,
  navigateTo = () => {},
  handleInquiryViaWhatsApp = () => {},
  openInquiryModal = () => {},
  products = [],
  categories = [],
}: HeroSectionClientProps) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  if (hero.enabled === false) return null;

  const style: HeroDesignStyle = hero.style || "split_classic";
  const title = hero.title || vendor?.businessName || "Welcome to Our Store";
  const subtitle = hero.subtitle || "Premium quality and personalized customer service.";
  const badgeText = hero.badgeText || "PREMIUM SELECTION";
  const buttonText = hero.buttonText || (isMultiPage ? "Shop Online Now" : "Order via WhatsApp");
  const secondaryButtonText = hero.secondaryButtonText || "Direct Inquiry";
  const mainImage = hero.bgImage || vendor?.banner || "";
  const secondaryImage = hero.secondaryImage || "";
  const highlightText = hero.highlightText || "";

  // Helper to highlight a specific word in the title if specified
  const renderHighlightedTitle = (baseTitle: string, highlight?: string, highlightColor?: string) => {
    if (!highlight || !baseTitle.toLowerCase().includes(highlight.toLowerCase())) {
      return baseTitle;
    }
    const parts = baseTitle.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} style={{ color: highlightColor || primaryColor }} className="font-black">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Primary Action Button Handler
  const handlePrimaryClick = () => {
    if (hero.buttonLink && hero.buttonLink.startsWith("#")) {
      const el = document.querySelector(hero.buttonLink);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (hero.buttonLink && hero.buttonLink.startsWith("/")) {
      navigateTo(hero.buttonLink.replace("/", ""));
      return;
    }
    if (isMultiPage) {
      navigateTo("products");
    } else {
      handleInquiryViaWhatsApp();
    }
  };

  // Secondary Action Button Handler
  const handleSecondaryClick = () => {
    if (hero.secondaryButtonLink && hero.secondaryButtonLink.startsWith("#")) {
      const el = document.querySelector(hero.secondaryButtonLink);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (hero.secondaryButtonLink && hero.secondaryButtonLink.startsWith("/")) {
      navigateTo(hero.secondaryButtonLink.replace("/", ""));
      return;
    }
    if (isMultiPage) {
      handleInquiryViaWhatsApp();
    } else {
      openInquiryModal({ name: vendor?.businessName || "Store Inquiry" }, "GENERAL");
    }
  };

  // -------------------------------------------------------------
  // 1. SPLIT CLASSIC (Refined Original Clean Layout)
  // -------------------------------------------------------------
  if (style === "split_classic") {
    return (
      <section id="home" className="relative py-12 sm:py-16 lg:py-24 overflow-hidden bg-slate-50/70 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 text-left">
            {badgeText && (
              <div
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-3 h-3" />
                <span className="truncate">{badgeText}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 break-words">
              {renderHighlightedTitle(title, highlightText)}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>{buttonText}</span>
              </button>
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-100 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/60 max-w-lg">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span>Top Rated</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200 group">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400 p-6 text-center">
                  <ShoppingBag className="w-16 h-16 mb-2 opacity-40" />
                  <span className="text-xs uppercase font-bold tracking-widest">{vendor?.businessName}</span>
                </div>
              )}
            </div>
            {/* Floating Trust Card */}
            <div className="absolute -bottom-4 -left-4 sm:bottom-4 sm:-left-6 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Verified Seller</p>
                <p className="text-[10px] text-slate-500 font-medium">Islandwide Delivery &amp; Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 2. CORPORATE OVERLAY (Inspired by Image 1: Bashwara & Co)
  // -------------------------------------------------------------
  if (style === "corporate_overlay") {
    const tickerList = hero.tickerItems && hero.tickerItems.length > 0
      ? hero.tickerItems
      : ["Our Inspired Store", "Precious Heritage", "Verified Quality", "Customer First", "Direct Support", "Islandwide Delivery"];

    return (
      <section id="home" className="relative min-h-[560px] lg:min-h-[640px] flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
        {/* Background Image with Dark Cinematic Tint */}
        <div className="absolute inset-0 z-0">
          {mainImage ? (
            <Image src={mainImage} alt={title} fill className="object-cover brightness-50 contrast-125" priority />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 text-center space-y-6">
          {badgeText && (
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-400">
              {badgeText}
            </span>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white">
            {renderHighlightedTitle(title, highlightText || "Inspired", "#f59e0b")}
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {subtitle}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="px-8 py-3.5 rounded-full font-black text-xs sm:text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-xl transition-all inline-flex items-center gap-2 group"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{secondaryButtonText}</span>
            </button>
          </div>
        </div>

        {/* Bottom Ticker/Pills Bar */}
        <div className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-3.5 px-4 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 sm:gap-10 text-[11px] font-extrabold tracking-wider uppercase text-slate-300 whitespace-nowrap">
            {tickerList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 3. TECH MODERN (Inspired by Image 2: HumanTec)
  // -------------------------------------------------------------
  if (style === "tech_modern") {
    return (
      <section id="home" className="relative py-12 sm:py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-slate-50 dark:from-slate-950 dark:to-cyan-950/20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            {badgeText && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                {badgeText}
              </span>
            )}

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {renderHighlightedTitle(title, highlightText || "Care.", "#06b6d4")}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="px-8 py-3.5 rounded-full font-black text-xs sm:text-sm text-white shadow-xl hover:opacity-95 transition-all inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{buttonText}</span>
              </button>
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Rounded Product Frame */}
            <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-cyan-50 dark:bg-slate-900 text-cyan-700 p-8 text-center">
                  <Sparkles className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-sm font-black">{vendor?.businessName}</span>
                </div>
              )}
            </div>

            {/* Floating Mobile/App Mockup Card */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-[210px] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white">Live Verified Store</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Instant order processing &amp; inquiry care</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black pt-1 border-t">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Genuine Care</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 4. ORGANIC MINIMAL LUXURY (Inspired by Image 3: TrueHive)
  // -------------------------------------------------------------
  if (style === "organic_minimal") {
    return (
      <section id="home" className="relative py-14 sm:py-20 lg:py-28 overflow-hidden bg-[#faf8f5] dark:bg-stone-900 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 text-left">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
              {badgeText || "PURITY YOU CAN VERIFY"}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100 leading-[1.12]">
              {renderHighlightedTitle(title, highlightText || "Trusted Always.", "#b45309")}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal max-w-lg">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="px-8 py-3.5 rounded-full font-black text-xs sm:text-sm text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 transition-all shadow-md"
              >
                <span>{buttonText}</span>
              </button>
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="px-7 py-3.5 rounded-full font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
              >
                <span>{secondaryButtonText}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center">
                  <Sparkles className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-xs uppercase font-bold tracking-widest">{vendor?.businessName}</span>
                </div>
              )}
            </div>
            {/* Minimal Dot Indicators */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <span className="w-6 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 5. FASHION EDITORIAL MULTI-PANEL (Inspired by Image 4: Fashion Bug)
  // -------------------------------------------------------------
  if (style === "fashion_editorial") {
    return (
      <section id="home" className="relative min-h-[500px] sm:min-h-[600px] overflow-hidden bg-slate-900 text-white flex items-center justify-center">
        {/* Full Image Banner with Editorial Tint */}
        <div className="absolute inset-0 z-0">
          {mainImage ? (
            <Image src={mainImage} alt={title} fill className="object-cover brightness-75 contrast-110" priority />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-stone-900 via-rose-950/40 to-stone-900" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Big Contrast Center Editorial Overlay */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 space-y-5">
          {badgeText && (
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-white">
              {badgeText}
            </span>
          )}

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white uppercase drop-shadow-md">
            {renderHighlightedTitle(title, highlightText)}
          </h1>

          <p className="text-xs sm:text-base text-slate-200 max-w-xl mx-auto tracking-wider uppercase font-semibold">
            {subtitle}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="px-8 py-3.5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-full hover:bg-slate-100 shadow-2xl transition-all"
            >
              {buttonText}
            </button>
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="px-6 py-3.5 bg-white/10 text-white backdrop-blur-md border border-white/30 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-white/20 transition-all"
            >
              {secondaryButtonText}
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={() => setActiveSlideIdx((prev) => (prev > 0 ? prev - 1 : 2))}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSlideIdx((prev) => (prev < 2 ? prev + 1 : 0))}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 6. CENTERED IMPACT
  // -------------------------------------------------------------
  if (style === "centered_impact") {
    return (
      <section id="home" className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-slate-50 dark:bg-slate-900 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {badgeText && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-sm mx-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badgeText}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            {renderHighlightedTitle(title, highlightText)}
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              {buttonText}
            </button>
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white dark:bg-slate-800 border text-slate-800 dark:text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-50"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 inline mr-2" />
              {secondaryButtonText}
            </button>
          </div>

          {/* Floating Trust Bar */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Fast Islandwide Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Genuine Care</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 7. GLASSMORPHISM (Dark Neon Futuristic)
  // -------------------------------------------------------------
  if (style === "glassmorphism") {
    return (
      <section id="home" className="relative py-16 sm:py-24 lg:py-28 overflow-hidden bg-slate-950 text-white border-b border-white/10">
        {/* Glow Spheres */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] opacity-40 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-30 bg-cyan-600 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl">
            {badgeText && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-cyan-400 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                {badgeText}
              </span>
            )}

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
              {renderHighlightedTitle(title, highlightText, "#38bdf8")}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-xl hover:opacity-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                {buttonText}
              </button>
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl group">
            {mainImage ? (
              <Image src={mainImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Sparkles className="w-12 h-12 mb-2 text-cyan-400" />
                <span className="text-xs uppercase font-bold tracking-widest">{vendor?.businessName}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 8. PROMO SALE (Mega Sale / Urgency Banner)
  // -------------------------------------------------------------
  if (style === "promo_sale") {
    const discountTag = hero.discountTag || "🔥 MEGA SALE • UP TO 50% OFF";
    return (
      <section id="home" className="relative py-12 sm:py-20 overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-5 text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-rose-600 shadow-md">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
              {discountTag}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] drop-shadow-sm">
              {renderHighlightedTitle(title, highlightText, "#fef08a")}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-rose-50 leading-relaxed font-medium">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="px-8 py-4 rounded-full font-black text-xs sm:text-sm bg-white text-rose-600 hover:bg-rose-50 shadow-2xl transition-all"
              >
                {buttonText}
              </button>
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="px-6 py-4 rounded-full font-bold text-xs sm:text-sm bg-black/20 hover:bg-black/30 text-white backdrop-blur-md border border-white/20 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/40 bg-white/10 group">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/70 p-8 text-center">
                  <Tag className="w-16 h-16 mb-2" />
                  <span className="text-sm font-black">{vendor?.businessName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 9. VIDEO MOTION (Cinematic Motion / Video Hero)
  // -------------------------------------------------------------
  if (style === "video_motion") {
    return (
      <section id="home" className="relative min-h-[540px] lg:min-h-[620px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Background Image / Motion Overlay */}
        <div className="absolute inset-0 z-0">
          {mainImage ? (
            <Image src={mainImage} alt={title} fill className="object-cover brightness-50" priority />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto hover:scale-110 transition-transform cursor-pointer shadow-2xl">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            {renderHighlightedTitle(title, highlightText)}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="px-8 py-3.5 rounded-full font-black text-xs sm:text-sm text-slate-950 bg-white hover:bg-slate-100 shadow-xl transition-all"
            >
              {buttonText}
            </button>
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{secondaryButtonText}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // 10. STORE CATALOG & SEARCH SPOTLIGHT
  // -------------------------------------------------------------
  if (style === "store_catalog") {
    return (
      <section id="home" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-slate-50 dark:bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            {badgeText && (
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                {badgeText}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {renderHighlightedTitle(title, highlightText)}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>

            {/* Quick Search Input */}
            <div className="pt-2 max-w-xl mx-auto">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products in our store..."
                  className="w-full pl-12 pr-28 py-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handlePrimaryClick}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 rounded-full text-white text-xs font-bold shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  Explore
                </button>
              </div>
            </div>
          </div>

          {/* Mini Featured Catalog Grid */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {products.slice(0, 4).map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => (isMultiPage ? navigateTo("products") : handleInquiryViaWhatsApp())}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.title || "Product"} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                  <p className="text-xs font-black" style={{ color: primaryColor }}>
                    Rs. {Number(item.price || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative aspect-[21/9] max-w-4xl mx-auto rounded-3xl overflow-hidden border shadow-lg">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  {vendor?.businessName}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Fallback to classic
  return null;
}
