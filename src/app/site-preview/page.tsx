"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SitePreviewPage() {
  const [siteData, setSiteData] = useState<any>({
    config: {
      primaryColor: "#E91E63",
      secondaryColor: "#111827",
      fontFamily: "Inter",
      headerStyle: "sticky",
      heroSection: {
        enabled: true,
        title: "Beautiful Nails Happier You",
        subtitle: "Premium care, relaxing spa experience, and expert styling crafted especially for you.",
        buttonText: "Book via WhatsApp",
        buttonLink: "#contact",
        badgeText: "PREMIUM SELECTION",
      },
      aboutSection: {
        enabled: true,
        title: "More Than Just a Store",
        content: "We provide exceptional products and services with a focus on unmatched quality and care.",
        images: [],
      },
      servicesSection: {
        enabled: true,
        title: "Nail Care Services",
        items: [
          { name: "Manicure", price: "Rs. 2,500" },
          { name: "Pedicure", price: "Rs. 3,000" },
          { name: "Gel Nails", price: "Rs. 4,500" },
          { name: "Nail Art", price: "Rs. 5,000" },
        ],
      },
      gallerySection: { enabled: true, title: "A Glimpse of Our Work", images: [] },
      reviewsSection: {
        enabled: true,
        title: "What Our Customers Say",
        items: [
          { name: "Chathuri Fernando", comment: "Amazing service and friendly staff! Loved the designs." },
          { name: "Nimali Perera", comment: "Clean, professional, and beautiful results!" },
        ],
      },
      contactSection: {
        enabled: true,
        phone: "077 123 4567",
        whatsapp: "077 123 4567",
        email: "hello@lushnails.lk",
        address: "123, Galle Road, Colombo 03",
      },
      footerSection: {
        enabled: true,
        copyrightText: `© ${new Date().getFullYear()} All rights reserved.`,
      },
    },
    entityInfo: {
      businessName: "Lush Nails Spa",
      slug: "lush-nails",
      logo: null,
    },
    pages: [],
    products: [],
  });
  const [activeTab, setActiveTab] = useState<string>("home");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    // Listen for real-time config updates from parent builder frame
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PREVIEW_UPDATE" && event.data?.payload) {
        setSiteData(event.data.payload);
        if (event.data.activePageSlug) {
          setActiveTab(event.data.activePageSlug);
        }
      } else if (event.data?.type === "PREVIEW_SET_PAGE") {
        if (event.data.pageSlug) {
          setActiveTab(event.data.pageSlug);
        }
        if (event.data.page) {
          setSiteData((prev: any) => {
            const existingPages = prev.pages || [];
            const idx = existingPages.findIndex(
              (p: any) => p.id === event.data.page.id || p.slug === event.data.page.slug
            );
            if (idx >= 0) {
              const updated = [...existingPages];
              updated[idx] = { ...updated[idx], ...event.data.page };
              return { ...prev, pages: updated };
            } else {
              return { ...prev, pages: [...existingPages, event.data.page] };
            }
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial message to parent indicating preview is ready
    try {
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    } catch (e) {}

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const switchPage = (slug: string) => {
    setActiveTab(slug);
    try {
      window.parent.postMessage({ type: "PAGE_SELECTED_IN_PREVIEW", pageSlug: slug }, "*");
    } catch (e) {}
  };

  const { config, entityInfo, pages, products } = siteData;
  const primaryColor = config?.primaryColor || "#E91E63";
  const hero = config?.heroSection || {};
  const about = config?.aboutSection || {};
  const services = config?.servicesSection || {};
  const gallery = config?.gallerySection || {};
  const reviews = config?.reviewsSection || {};
  const contact = config?.contactSection || {};
  const footer = config?.footerSection || {};

  const whatsappPhone = (contact.whatsapp || contact.phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "#";

  const currentPage = pages?.find((p: any) => p.slug === activeTab);

  return (
    <div
      className="min-h-screen bg-white text-slate-900 selection:bg-rose-100 selection:text-rose-900"
      style={{ fontFamily: config?.fontFamily || "Inter, sans-serif" }}
    >
      {/* ── Branded Navigation Bar ── */}
      <header
        className={`bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 transition-all ${
          config?.headerStyle === "floating" ? "m-4 rounded-2xl shadow-xl border" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {entityInfo?.logo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border shadow-sm">
                <Image src={entityInfo.logo} alt="Logo" fill className="object-cover" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {entityInfo?.businessName?.charAt(0) || "S"}
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight block">
                {entityInfo?.businessName || "My Store"}
              </span>
              {entityInfo?.tagline && (
                <span className="text-[11px] text-slate-500 tracking-wider uppercase block font-medium">
                  {entityInfo.tagline}
                </span>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button
              onClick={() => switchPage("home")}
              className="hover:text-black transition-colors font-bold"
              style={{ color: activeTab === "home" ? primaryColor : undefined }}
            >
              Home
            </button>
            {activeTab === "home" && services.enabled && (
              <a href="#services" className="hover:text-black transition-colors">
                Services
              </a>
            )}
            {activeTab === "home" && (
              <a href="#products" className="hover:text-black transition-colors">
                Products
              </a>
            )}
            {activeTab === "home" && about.enabled && (
              <a href="#about" className="hover:text-black transition-colors">
                About
              </a>
            )}
            {activeTab === "home" && gallery.enabled && (
              <a href="#gallery" className="hover:text-black transition-colors">
                Gallery
              </a>
            )}
            {activeTab === "home" && reviews.enabled && (
              <a href="#reviews" className="hover:text-black transition-colors">
                Reviews
              </a>
            )}
            <a href="#contact" className="hover:text-black transition-colors">
              Contact
            </a>

            {/* Custom Pages Menu for Tier 2/3 */}
            {pages && pages.length > 0 && (
              <div className="flex items-center gap-4 border-l pl-4">
                {pages.map((p: any) => {
                  const isActive = activeTab === p.slug;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => switchPage(p.slug)}
                      className={`transition-all text-xs uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg ${
                        isActive ? "text-white shadow-sm" : "hover:text-black text-slate-600"
                      }`}
                      style={{ backgroundColor: isActive ? primaryColor : undefined }}
                    >
                      {p.title}
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Book via WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── CONDITIONAL RENDERING: CUSTOM PAGE VS ONE-PAGE HOME ── */}
      {activeTab !== "home" ? (
        currentPage ? (
          <div>
            {/* Breadcrumb Navigation Bar */}
            <div className="bg-slate-50 border-b py-3">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <button onClick={() => switchPage("home")} className="hover:text-slate-900 transition-colors">
                  Home
                </button>
                <span>/</span>
                <span className="text-slate-900 font-bold">{currentPage.title}</span>
              </div>
            </div>

            {/* Custom Page Header / Hero Banner */}
            <section className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentPage.sectionsJson?.banner?.badge || entityInfo?.businessName || "STORE PAGE"}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {currentPage.sectionsJson?.banner?.title || currentPage.title}
                </h1>

                {(currentPage.sectionsJson?.banner?.subtitle || currentPage.metaDescription) && (
                  <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    {currentPage.sectionsJson?.banner?.subtitle || currentPage.metaDescription}
                  </p>
                )}

                {currentPage.sectionsJson?.banner?.bgImage && (
                  <div className="pt-6 max-w-2xl mx-auto">
                    <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <Image
                        src={currentPage.sectionsJson.banner.bgImage}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Custom Page Main Content */}
            <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {currentPage.contentHtml ? (
                <div className="bg-white p-8 sm:p-10 rounded-3xl border shadow-sm text-slate-700 text-base leading-relaxed whitespace-pre-line space-y-4">
                  {currentPage.contentHtml}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                  <p className="font-bold">No custom description added yet.</p>
                  <p className="text-xs mt-1">Use the Website Builder Page Designer on the left to write and style this page.</p>
                </div>
              )}

              {/* Feature Cards Grid */}
              {currentPage.sectionsJson?.featureCards && currentPage.sectionsJson.featureCards.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-black text-slate-900 mb-6 text-center">Page Highlights & Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentPage.sectionsJson.featureCards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow space-y-3"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900">{card.title || "Feature Item"}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{card.description || "Details about this feature or service."}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Accordion Section */}
              {currentPage.sectionsJson?.faq && currentPage.sectionsJson.faq.length > 0 && (
                <div className="mt-14 space-y-4">
                  <div className="text-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                      HELP & CLARIFICATION
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Frequently Asked Questions</h3>
                  </div>
                  <div className="space-y-3">
                    {currentPage.sectionsJson.faq.map((item: any, idx: number) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={idx} className="border rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full p-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <span>{item.question || `Question #${idx + 1}`}</span>
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-1 text-xs text-slate-600 leading-relaxed border-t bg-slate-50/50">
                              {item.answer || "Answer details will appear here."}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Call-to-Action WhatsApp Card */}
              <div
                className="mt-14 p-8 sm:p-10 rounded-3xl text-white text-center shadow-xl space-y-4"
                style={{ backgroundColor: primaryColor }}
              >
                <h3 className="text-2xl sm:text-3xl font-black">
                  {currentPage.sectionsJson?.cta?.title || `Need Assistance with ${currentPage.title}?`}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 max-w-lg mx-auto">
                  Our store team is available directly on WhatsApp to answer your inquiries and take your orders.
                </p>
                <div className="pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-slate-900 font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>{currentPage.sectionsJson?.cta?.buttonText || "Connect via WhatsApp"}</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-black text-slate-800">Page Not Found</h2>
            <p className="text-xs text-slate-500">This custom page has either been moved or deleted.</p>
            <button
              onClick={() => switchPage("home")}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Return to Home
            </button>
          </div>
        )
      ) : (
        <>
          {/* ── Hero Section ── */}
          {hero.enabled !== false && (
            <section id="home" className="relative py-16 sm:py-24 overflow-hidden bg-slate-50/60 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {hero.badgeText && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{hero.badgeText}</span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
                {hero.title || "Beautiful Nails Happier You"}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {hero.subtitle ||
                  "Premium care, relaxing spa experience, and expert styling crafted especially for you."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={hero.buttonLink || whatsappUrl}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-black text-sm shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{hero.buttonText || "Book via WhatsApp"}</span>
                </a>
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-100 transition-all"
                >
                  <span>Explore Menu</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
                {hero.bgImage ? (
                  <Image src={hero.bgImage} alt="Hero" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400 p-6 text-center">
                    <ShoppingBag className="w-16 h-16 mb-2 opacity-40" />
                    <span className="text-xs uppercase font-bold tracking-widest">Upload Hero Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Services Section ── */}
      {services.enabled && (
        <section id="services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                OUR SERVICES
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                {services.title || "Featured Services"}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(services.items?.length > 0
              ? services.items
              : [
                  { name: "Manicure", price: "Rs. 2,500" },
                  { name: "Pedicure", price: "Rs. 3,000" },
                  { name: "Gel Nails", price: "Rs. 4,500" },
                  { name: "Nail Art", price: "Rs. 5,000" },
                ]
            ).map((s: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Service Photo
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
                    <p className="text-sm font-bold text-slate-600 mt-1">{s.price}</p>
                  </div>
                  <a
                    href={whatsappUrl}
                    className="mt-4 inline-flex items-center justify-center w-full py-2.5 rounded-xl text-white text-xs font-black shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Products Showcase Section ── */}
      <section id="products" className="py-20 bg-slate-50/50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              SHOP PRODUCTS
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">Direct From Our Store</h2>
            <p className="text-sm text-slate-500 mt-2">
              Order directly via WhatsApp or browse our online marketplace inventory.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {(products && products.length > 0 ? products.slice(0, 8) : [1, 2, 3, 4]).map((p: any, idx: number) => {
              const name = p.name || `Collection Item #${idx + 1}`;
              const price = p.price ? `Rs. ${Number(p.price).toLocaleString()}` : "Rs. 3,900";
              const img = p.images?.[0]?.url || p.images?.[0];

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border p-3 hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <div className="aspect-square rounded-xl bg-slate-100 relative overflow-hidden mb-3">
                    {img ? (
                      <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black text-slate-900">{price}</span>
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(`Hi, I would like to order: ${name}`)}`}
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-[11px] shadow-sm hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Order
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      {about.enabled && (
        <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                ABOUT US
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                {about.title || "More Than Just a Store"}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {about.content ||
                  "We provide exceptional products and services with a focus on unmatched quality, attention to detail, and top-tier customer satisfaction."}
              </p>
              <div className="pt-2">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden relative border shadow-lg">
              {about.images?.[0] ? (
                <Image src={about.images[0]} alt="About" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  About Us Photo
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials Section ── */}
      {reviews.enabled && (
        <section id="reviews" className="py-20 bg-slate-50/50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                TESTIMONIALS
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                {reviews.title || "What Our Customers Say"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(reviews.items?.length > 0
                ? reviews.items
                : [
                    { name: "Chathuri Fernando", comment: "Amazing service and very friendly staff! Highly recommended!" },
                    { name: "Nimali Perera", comment: "Such a relaxing place with excellent service. Loved the designs!" },
                    { name: "Yasara Silva", comment: "Clean, professional, and beautiful results. Best in town!" },
                  ]
              ).map((r: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic">"{r.comment}"</p>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-extrabold text-slate-900">{r.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Verified Customer</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )}

      {/* ── Contact Section ── */}
      <footer id="contact" className="bg-slate-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              GET IN TOUCH
            </span>
            <h3 className="text-3xl font-black tracking-tight">Book Your Visit Today</h3>
            <div className="space-y-2 text-sm text-slate-400 pt-2">
              {contact.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{contact.address}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{contact.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center space-y-4">
            <a
              href={whatsappUrl}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-black text-sm shadow-xl hover:opacity-95 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Book via WhatsApp</span>
            </a>
            <p className="text-xs text-slate-500">
              {footer.copyrightText || `© ${new Date().getFullYear()} ${entityInfo?.businessName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
