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
  Search,
  Building2,
  Clock,
  Send,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SitePreviewPage() {
  const [hasReceivedData, setHasReceivedData] = useState<boolean>(false);
  const [siteData, setSiteData] = useState<any>({
    config: {
      primaryColor: "#5c2336",
      secondaryColor: "#111827",
      fontFamily: "Inter",
      headerStyle: "sticky",
      heroSection: {
        enabled: true,
        title: "",
        subtitle: "",
        buttonText: "Book via WhatsApp",
        buttonLink: "#contact",
        badgeText: "PREMIUM SELECTION",
      },
      aboutSection: {
        enabled: true,
        title: "About Us",
        content: "",
        images: [],
      },
      servicesSection: {
        enabled: true,
        title: "Featured Services & Products",
        items: [],
      },
      productsSection: {
        enabled: true,
        title: "Store Products",
        subtitle: "",
        badge: "STORE INVENTORY",
      },
      gallerySection: { enabled: false, title: "A Glimpse of Our Work", images: [] },
      reviewsSection: {
        enabled: false,
        title: "What Our Customers Say",
        items: [],
      },
      contactSection: {
        enabled: true,
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
      },
      footerSection: {
        enabled: true,
        copyrightText: `© ${new Date().getFullYear()} All rights reserved.`,
      },
    },
    entityInfo: {
      businessName: "",
      slug: "",
      logo: null,
    },
    pages: [],
    products: [],
  });
  const [activeTab, setActiveTab] = useState<string>("home");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState<string>("");

  useEffect(() => {
    // Listen for real-time config updates from parent builder frame
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PREVIEW_UPDATE" && event.data?.payload) {
        setSiteData(event.data.payload);
        setHasReceivedData(true);
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
  // Dynamic navigation items
  const defaultNavItems = [
    { id: "home", label: "Home", type: "scroll", target: "home", visible: true },
    { id: "services", label: "Services", type: "scroll", target: "services", visible: services.enabled !== false },
    {
      id: "products",
      label: siteData?.entityType === "ADS_SELLER" ? "My Ads" : "Products",
      type: "scroll",
      target: "products",
      visible: config.productsSection?.enabled !== false,
    },
    { id: "about", label: "About", type: "scroll", target: "about", visible: about.enabled !== false },
    {
      id: "gallery",
      label: "Gallery",
      type: "scroll",
      target: "gallery",
      visible: Boolean(gallery.enabled) && Boolean(gallery.images && gallery.images.length > 0),
    },
    {
      id: "reviews",
      label: "Reviews",
      type: "scroll",
      target: "reviews",
      visible: Boolean(reviews.enabled) && Boolean(reviews.items && reviews.items.length > 0),
    },
    { id: "contact", label: "Contact", type: "scroll", target: "contact", visible: true },
  ];

  const configuredNavItems: any[] =
    config?.navItemsJson && Array.isArray(config.navItemsJson) && config.navItemsJson.length > 0
      ? config.navItemsJson
      : defaultNavItems;

  const visibleNavItems = configuredNavItems.filter((item: any) => {
    if (item.visible === false || item.visible === "false") return false;
    if (item.id === "gallery" && (!gallery.enabled || !gallery.images || gallery.images.length === 0)) {
      return false;
    }
    if (item.id === "reviews" && (!reviews.enabled || !reviews.items || reviews.items.length === 0)) {
      return false;
    }
    return true;
  });

  const handleNavClick = (item: any) => {
    if (item.type === "page") {
      switchPage(item.target);
    } else {
      if (activeTab !== "home") {
        switchPage("home");
        setTimeout(() => {
          if (item.target === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const el = document.getElementById(item.target);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
        }, 150);
      } else {
        if (item.target === "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById(item.target);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const filteredProducts = (products || []).filter((p: any) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    const title = (p.title || p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    return title.includes(term) || desc.includes(term);
  });

  if (!hasReceivedData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Live Preview...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-rose-500 selection:text-white">
      {/* ── Branded Navigation Bar ── */}
      <header
        className={`bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 transition-all ${
          config?.headerStyle === "floating" ? "m-4 rounded-2xl shadow-xl border" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => switchPage("home")}>
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

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            {visibleNavItems.map((item: any) => {
              const isActive =
                (item.type === "page" && activeTab === item.target) ||
                (item.type === "scroll" && activeTab === "home" && item.target === "home");
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`transition-all font-bold text-xs uppercase tracking-wider ${
                    isActive ? "font-extrabold" : "hover:text-black text-slate-600"
                  }`}
                  style={{ color: isActive ? primaryColor : undefined }}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Custom Pages Menu */}
            {pages && pages.length > 0 && (
              <div className="flex items-center gap-3 border-l pl-4">
                {pages
                  .filter((p: any) => {
                    const excluded = configuredNavItems.some(
                      (ni: any) =>
                        (ni.target === p.slug || ni.id === `custom-page-${p.id}`) &&
                        (ni.visible === false || ni.visible === "false")
                    );
                    if (excluded) return false;
                    return !visibleNavItems.some((ni: any) => ni.target === p.slug);
                  })
                  .map((p: any) => {
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
              <span>{config.headerSection?.buttonText || "Book via WhatsApp"}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── CONDITIONAL RENDERING: DEDICATED PRODUCTS / SERVICES / CUSTOM PAGE VS ONE-PAGE HOME ── */}
      {activeTab === "products" ? (
        <div>
          {/* Breadcrumb Navigation Bar */}
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <button onClick={() => switchPage("home")} className="hover:text-slate-900 transition-colors">
                  Home
                </button>
                <span>/</span>
                <span className="text-slate-900 font-bold">
                  {config.productsSection?.title || (siteData?.entityType === "ADS_SELLER" ? "My Ads Catalog" : "Store Products")}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {products?.length || 0} items available
              </span>
            </div>
          </div>

          {/* Dedicated Header & Search Bar */}
          <section className="py-12 bg-gradient-to-b from-slate-50 to-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{siteData?.entityType === "ADS_SELLER" ? "CLASSIFIED ADS CATALOG" : "OFFICIAL STORE CATALOG"}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  {config.productsSection?.title || (siteData?.entityType === "ADS_SELLER" ? "All Ads & Offerings" : "All Products & Collections")}
                </h1>
                <p className="text-sm text-slate-500">
                  Browse our full inventory, check prices, and order directly on WhatsApp.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by keyword, item name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-white text-xs font-semibold focus:outline-none focus:ring-2 shadow-sm"
                  style={{ "--tw-ring-color": primaryColor } as any}
                />
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((p: any, idx: number) => {
                  const title = p.title || p.name || `Product #${idx + 1}`;
                  const price =
                    p.price != null && p.price !== ""
                      ? `Rs. ${Number(p.price).toLocaleString()}`
                      : p.type === "AD"
                      ? "Contact for price"
                      : "Rs. 0";
                  const img = p.image || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : null);

                  return (
                    <div
                      key={p.id || idx}
                      className="bg-white rounded-2xl border p-4 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square rounded-xl bg-slate-100 relative overflow-hidden mb-3">
                          {img ? (
                            <Image src={img} alt={title} fill className="object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ShoppingBag className="w-10 h-10" />
                            </div>
                          )}
                          {p.type && (
                            <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[9px] uppercase font-black text-white px-2 py-0.5 rounded-full">
                              {p.type === "AD" ? "Verified Ad" : "In Stock"}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{title}</h4>
                        {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Price</span>
                          <span className="text-sm font-black text-slate-900">{price}</span>
                        </div>
                        <a
                          href={`${whatsappUrl}?text=${encodeURIComponent(
                            `Hi, I'm interested in ordering: ${title} (${price}) from your website catalog!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">No matching items found</h3>
                <p className="text-xs text-slate-500">Try searching with a different keyword</p>
              </div>
            )}
          </section>
        </div>
      ) : activeTab === "services" ? (
        <div>
          {/* Dedicated Services Page */}
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <button onClick={() => switchPage("home")} className="hover:text-slate-900 transition-colors">
                Home
              </button>
              <span>/</span>
              <span className="text-slate-900 font-bold">{services.title || "Our Services"}</span>
            </div>
          </div>

          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                SERVICES & PACKAGES
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{services.title || "Our Services & Packages"}</h1>
              {services.subtitle && <p className="text-slate-500 text-sm">{services.subtitle}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {((services.items && services.items.length > 0)
                ? services.items
                : (products && products.length > 0
                    ? products.map((p: any) => ({
                        name: p.title || p.name,
                        price: p.price != null ? `Rs. ${Number(p.price).toLocaleString()}` : "Contact for price",
                        imageUrl: p.image || p.images?.[0]?.url || p.images?.[0],
                        description: p.description,
                      }))
                    : []
                  )
              ).map((s: any, idx: number) => (
                <div key={idx} className="bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="aspect-[16/10] bg-slate-100 relative">
                      {s.imageUrl ? (
                        <Image src={s.imageUrl} alt={s.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-10 h-10 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-black text-slate-900">{s.name}</h3>
                      {s.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{s.description}</p>}
                    </div>
                  </div>
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                    <span className="text-base font-black text-slate-900">{s.price}</span>
                    <a
                      href={`${whatsappUrl}?text=${encodeURIComponent(`Hi, I'd like to book your service: ${s.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-90 inline-flex items-center gap-1.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Book Now</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : activeTab !== "home" ? (
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
      {services.enabled !== false && (
        <section id="services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                OUR SERVICES & OFFERINGS
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                {services.title || "Featured Services"}
              </h2>
              {services.subtitle && (
                <p className="text-sm text-slate-500 mt-2">{services.subtitle}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {((services.items && services.items.length > 0)
              ? services.items
              : (products && products.length > 0
                  ? products.slice(0, 4).map((p: any) => ({
                      name: p.title || p.name,
                      price: p.price != null ? `Rs. ${Number(p.price).toLocaleString()}` : "Contact for price",
                      imageUrl: p.image || p.images?.[0]?.url || p.images?.[0],
                      description: p.description,
                    }))
                  : [
                      { name: "Consultation & Styling", price: "Complimentary" },
                      { name: "Premium Care Package", price: "Rs. 3,500" },
                      { name: "Express Service", price: "Rs. 2,000" },
                      { name: "Special Collection", price: "Rs. 4,500" },
                    ]
                )
            ).map((s: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                      <ShoppingBag className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Service Feature</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{s.name}</h3>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                    )}
                    <p className="text-sm font-black mt-2" style={{ color: primaryColor }}>
                      {s.price}
                    </p>
                  </div>
                  <a
                    href={`${whatsappUrl}?text=${encodeURIComponent(`Hi, I'm interested in booking your service: ${s.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-xs font-black shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Book Service</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Products Showcase Section (⚡ Live Synced with TryMe) ── */}
      {config.productsSection?.enabled !== false && (
        <section id="products" className="py-20 bg-slate-50/50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5" style={{ color: primaryColor }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{config.productsSection?.badge || "STORE INVENTORY"}</span>
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                {config.productsSection?.title || (siteData?.entityType === "ADS_SELLER" ? "Active Ads & Services" : "Direct From Our Store")}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {config.productsSection?.subtitle || "Browse verified catalog items and order directly via WhatsApp or visit our physical store."}
              </p>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((p: any, idx: number) => {
                  const title = p.title || p.name || `Product #${idx + 1}`;
                  const price = p.price != null && p.price !== ""
                    ? `Rs. ${Number(p.price).toLocaleString()}`
                    : (p.type === "AD" ? "Contact for price" : "Rs. 0");
                  const img = p.image || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : null);

                  return (
                    <div
                      key={p.id || idx}
                      className="bg-white rounded-2xl border p-3.5 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square rounded-xl bg-slate-100 relative overflow-hidden mb-3">
                          {img ? (
                            <Image src={img} alt={title} fill className="object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ShoppingBag className="w-10 h-10" />
                            </div>
                          )}
                          {p.type && (
                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] uppercase font-black text-white px-2 py-0.5 rounded-full">
                              {p.type === "AD" ? "Ad" : "Product"}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 title-font">{title}</h4>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm font-black text-slate-900">{price}</span>
                        <a
                          href={`${whatsappUrl}?text=${encodeURIComponent(`Hi, I would like to order/inquire about: ${title} (${price})`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg text-white font-bold text-[11px] shadow-sm hover:opacity-90 inline-flex items-center gap-1"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Order</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-10 text-center max-w-md mx-auto space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-base text-slate-800">No Items Listed Yet</h4>
                <p className="text-xs text-slate-500">
                  Products and ads you add in your TryMe dashboard will automatically sync and appear right here.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── About Section ── */}
      {about.enabled !== false && (
        <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-widest inline-block" style={{ color: primaryColor }}>
                {about.badge || "ABOUT US"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {about.title || "More Than Just a Store"}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {about.content ||
                  "We provide exceptional products and services with a focus on unmatched quality, attention to detail, and top-tier customer satisfaction."}
              </p>

              {/* Highlights & Trust Badges */}
              {(about.highlights || [
                "100% Genuine Products",
                "Fast Islandwide Delivery",
                "Friendly WhatsApp Support",
              ]).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(about.highlights || [
                    "100% Genuine Products",
                    "Fast Islandwide Delivery",
                    "Friendly WhatsApp Support",
                  ]).map((h: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <a
                  href={`${whatsappUrl}?text=${encodeURIComponent(
                    `Hi, I'm reaching out after reading about ${entityInfo?.businessName || "your store"} on your website!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{about.buttonText || "Inquire via WhatsApp"}</span>
                </a>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden relative border shadow-lg">
              {about.images?.[0] ? (
                <Image src={about.images[0]} alt="About Us" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-8 text-center space-y-2">
                  <Building2 className="w-12 h-12 opacity-30 text-slate-500" />
                  <span className="font-bold text-xs uppercase tracking-widest text-slate-600">
                    {entityInfo?.businessName || "About Us Photo"}
                  </span>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Upload your store, team, or workshop photo in the Website Builder Sections tab
                  </p>
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
      {contact.enabled !== false && (
        <section id="contact" className="py-16 bg-slate-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                GET IN TOUCH
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {contact.title || "Visit Us or Connect"}
              </h2>
              <p className="text-slate-500 text-sm">
                {contact.subtitle || "We would love to assist you. Drop by our store, call us, or send an inquiry below."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Direct Info, Hours & Map */}
              <div className={`${contact.showContactForm !== false ? "lg:col-span-6" : "lg:col-span-8 lg:mx-auto"} space-y-6`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contact.phone && (
                    <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Phone Call</span>
                      </div>
                      <span className="font-bold text-xs text-slate-800 block">{contact.phone}</span>
                    </div>
                  )}
                  {whatsappPhone && (
                    <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                      </div>
                      <span className="font-bold text-xs text-emerald-600 block">{contact.whatsapp || contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
                      </div>
                      <span className="font-bold text-xs text-slate-800 truncate block">{contact.email}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Address</span>
                      </div>
                      <span className="font-semibold text-xs text-slate-700 line-clamp-2 block">{contact.address}</span>
                    </div>
                  )}
                </div>

                {/* Opening Hours */}
                {contact.showOpeningHours !== false && (
                  <div className="p-5 rounded-2xl bg-white border shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-900">Opening &amp; Working Hours</h4>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Open Daily
                      </span>
                    </div>
                    <div className="pt-2 border-t space-y-1.5 text-xs text-slate-600">
                      {(contact.openingHours || "Monday – Saturday: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 5:00 PM")
                        .split("\n")
                        .map((line: string, i: number) => (
                          <div key={i} className="flex items-center justify-between py-0.5">
                            <span className="font-medium text-slate-500">{line.split(":")[0]}</span>
                            <span className="font-bold text-slate-800">{line.split(":").slice(1).join(":") || line}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Map */}
                {contact.showMap && (
                  <div className="rounded-2xl border bg-white p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-slate-800">Store Map</span>
                      </div>
                      {contact.address && (
                        <span className="text-[11px] font-bold text-slate-400">Interactive Location</span>
                      )}
                    </div>
                    <div className="w-full h-44 rounded-xl overflow-hidden border">
                      <iframe
                        title="Preview Map"
                        src={
                          contact.mapEmbedUrl ||
                          `https://maps.google.com/maps?q=${encodeURIComponent(contact.address || entityInfo?.businessName || "Colombo")}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                        }
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Inquiry Form */}
              {contact.showContactForm !== false && (
                <div className="lg:col-span-6">
                  <div className="p-6 sm:p-7 rounded-3xl bg-white border shadow-md space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        {contact.formTitle || "Send Us a Message"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {contact.formSubtitle || "Fill out your details below and we will contact you promptly."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Name</label>
                        <input
                          type="text"
                          readOnly
                          placeholder="e.g. Kamal Perera"
                          className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-xs text-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone / WhatsApp</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="07XXXXXXXX"
                            className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Email (Optional)</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Message</label>
                        <textarea
                          readOnly
                          rows={2}
                          placeholder="Write your inquiry or question here..."
                          className="w-full px-3 py-2 rounded-xl border bg-slate-50 text-xs text-slate-800 resize-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Inquiry</span>
                        </button>
                        {whatsappPhone && (
                          <button
                            type="button"
                            className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Multi-Column Modern Footer ── */}
      {footer.enabled !== false && (
        <footer className="bg-slate-950 text-white pt-14 pb-8 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
              {/* Col 1: Store Brand */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center gap-3">
                  {entityInfo?.logo ? (
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-800 shadow-sm shrink-0">
                      <Image src={entityInfo.logo} alt="Logo" fill className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {entityInfo?.businessName?.charAt(0) || "S"}
                    </div>
                  )}
                  <span className="font-black text-lg tracking-tight text-white">
                    {entityInfo?.businessName || "My Store"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  {footer.storeBio || entityInfo?.tagline || "Discover high quality curated products with premium customer care."}
                </p>

                {/* Social Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {footer.socialLinks?.facebook && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      Facebook
                    </span>
                  )}
                  {footer.socialLinks?.instagram && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      Instagram
                    </span>
                  )}
                  {footer.socialLinks?.tiktok && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      TikTok
                    </span>
                  )}
                  {footer.socialLinks?.youtube && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      YouTube
                    </span>
                  )}
                  {footer.socialLinks?.twitter && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      Twitter / X
                    </span>
                  )}
                  {footer.socialLinks?.linkedin && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                      LinkedIn
                    </span>
                  )}
                </div>
              </div>

              {/* Col 2: Quick Links */}
              {footer.showQuickLinks !== false && (
                <div className="lg:col-span-2 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Explore
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-400 font-semibold">
                    {visibleNavItems.map((item: any) => (
                      <li key={item.id} className="cursor-pointer hover:text-white transition-colors">
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Col 3: Pages */}
              {footer.showPagesLinks !== false && (
                <div className="lg:col-span-3 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Pages &amp; Policies
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-400 font-semibold">
                    {pages && pages.length > 0 ? (
                      pages.map((p: any) => (
                        <li key={p.slug} className="cursor-pointer hover:text-white transition-colors">
                          {p.title}
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="cursor-pointer hover:text-white transition-colors">About Store</li>
                        <li className="cursor-pointer hover:text-white transition-colors">Store Location</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {/* Col 4: Contact & Newsletter */}
              <div className={`${footer.showQuickLinks !== false && footer.showPagesLinks !== false ? "lg:col-span-3" : "lg:col-span-5"} space-y-3`}>
                {footer.showContactInfo !== false && (
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                      Store Contact
                    </h4>
                    {contact.address && <p className="line-clamp-2">{contact.address}</p>}
                    {contact.phone && <p>{contact.phone}</p>}
                    {contact.email && <p>{contact.email}</p>}
                  </div>
                )}

                {footer.showNewsletter && (
                  <div className="pt-2 space-y-1.5">
                    <h5 className="text-xs font-bold text-white">
                      {footer.newsletterTitle || "Subscribe to Newsletter"}
                    </h5>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        readOnly
                        placeholder="Enter email"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                {footer.copyrightText || `© ${new Date().getFullYear()} ${entityInfo?.businessName || "Store"}. All rights reserved.`}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                <span>Powered by <strong className="text-slate-400 font-bold">TryMe Stores</strong></span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
