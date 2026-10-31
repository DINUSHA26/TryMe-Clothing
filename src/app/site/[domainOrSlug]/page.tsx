import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStandaloneSiteData } from "@/lib/site-resolver";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Star,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface SitePageProps {
  params: Promise<{ domainOrSlug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export default async function StandaloneSitePage({ params, searchParams }: SitePageProps) {
  const { domainOrSlug } = await params;
  const searchParamsObj = searchParams ? await searchParams : {};
  const activePageSlug = searchParamsObj?.page || null;

  const siteData = await getStandaloneSiteData(domainOrSlug);

  if (!siteData) {
    notFound();
  }

  const { vendor, config, products } = siteData;
  const pages: any[] = config?.pages || [];
  const primaryColor = config?.primaryColor || "#E91E63";
  const hero = config?.heroSection || {};
  const about = config?.aboutSection || {};
  const services = config?.servicesSection || {};
  const gallery = config?.gallerySection || {};
  const reviews = config?.reviewsSection || {};
  const contact = config?.contactSection || {};
  const footer = config?.footerSection || {};

  const whatsappPhone = (contact.whatsapp || contact.phone || vendor?.phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "#";

  const requestedPage = activePageSlug ? pages.find((p) => p.slug === activePageSlug) : null;

  return (
    <div
      className="min-h-screen bg-white text-slate-900 selection:bg-rose-100 selection:text-rose-900"
      style={{ fontFamily: config?.fontFamily || "Inter, sans-serif" }}
    >
      {/* ── Standalone Vendor Header ── */}
      <header className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href={`/site/${domainOrSlug}`} className="flex items-center gap-3">
            {vendor?.logo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border shadow-sm">
                <Image src={vendor.logo} alt="Logo" fill className="object-cover" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {vendor?.businessName?.charAt(0) || "S"}
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight block">
                {vendor?.businessName || "Store"}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link
              href={`/site/${domainOrSlug}`}
              className="hover:text-black transition-colors font-bold"
              style={{ color: !activePageSlug ? primaryColor : undefined }}
            >
              Home
            </Link>
            {!activePageSlug && services.enabled && (
              <a href="#services" className="hover:text-black transition-colors">
                Services
              </a>
            )}
            {!activePageSlug && (
              <a href="#products" className="hover:text-black transition-colors">
                Products
              </a>
            )}
            {!activePageSlug && about.enabled && (
              <a href="#about" className="hover:text-black transition-colors">
                About
              </a>
            )}
            {!activePageSlug && gallery.enabled && (
              <a href="#gallery" className="hover:text-black transition-colors">
                Gallery
              </a>
            )}
            {!activePageSlug && reviews.enabled && (
              <a href="#reviews" className="hover:text-black transition-colors">
                Reviews
              </a>
            )}
            <a href="#contact" className="hover:text-black transition-colors">
              Contact
            </a>

            {/* Custom Multi-Pages */}
            {pages.length > 0 && (
              <div className="flex items-center gap-4 border-l pl-4">
                {pages.map((p) => {
                  const isCurrent = activePageSlug === p.slug;
                  return (
                    <Link
                      key={p.slug}
                      href={`/site/${domainOrSlug}?page=${p.slug}`}
                      className={`text-xs uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                        isCurrent ? "text-white shadow-sm" : "hover:text-black text-slate-600"
                      }`}
                      style={{ backgroundColor: isCurrent ? primaryColor : undefined }}
                    >
                      {p.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

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
      </header>

      {/* ── CONDITIONAL RENDERING: CUSTOM PAGE VS ONE-PAGE HOME ── */}
      {activePageSlug ? (
        requestedPage ? (
          <div>
            {/* Breadcrumbs */}
            <div className="bg-slate-50 border-b py-3">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Link href={`/site/${domainOrSlug}`} className="hover:text-slate-900 transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="text-slate-900 font-bold">{requestedPage.title}</span>
              </div>
            </div>

            {/* Custom Page Hero Banner */}
            <section className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{requestedPage.sectionsJson?.banner?.badge || vendor.businessName}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {requestedPage.sectionsJson?.banner?.title || requestedPage.title}
                </h1>

                {(requestedPage.sectionsJson?.banner?.subtitle || requestedPage.metaDescription) && (
                  <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    {requestedPage.sectionsJson?.banner?.subtitle || requestedPage.metaDescription}
                  </p>
                )}

                {requestedPage.sectionsJson?.banner?.bgImage && (
                  <div className="pt-6 max-w-2xl mx-auto">
                    <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                      <Image
                        src={requestedPage.sectionsJson.banner.bgImage}
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
              {requestedPage.contentHtml && (
                <div className="bg-white p-8 sm:p-10 rounded-3xl border shadow-sm text-slate-700 text-base leading-relaxed whitespace-pre-line space-y-4">
                  {requestedPage.contentHtml}
                </div>
              )}

              {/* Feature Cards Grid */}
              {requestedPage.sectionsJson?.featureCards && requestedPage.sectionsJson.featureCards.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-black text-slate-900 mb-6 text-center">Highlights & Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requestedPage.sectionsJson.featureCards.map((card: any, idx: number) => (
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
                        <h4 className="font-extrabold text-base text-slate-900">{card.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{card.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Section */}
              {requestedPage.sectionsJson?.faq && requestedPage.sectionsJson.faq.length > 0 && (
                <div className="mt-14 space-y-4">
                  <div className="text-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                      HELP & CLARIFICATION
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Frequently Asked Questions</h3>
                  </div>
                  <div className="space-y-3">
                    {requestedPage.sectionsJson.faq.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-2xl overflow-hidden bg-white shadow-sm p-4">
                        <p className="font-bold text-sm text-slate-900">{item.question}</p>
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call-to-Action WhatsApp Card */}
              <div
                className="mt-14 p-8 sm:p-10 rounded-3xl text-white text-center shadow-xl space-y-4"
                style={{ backgroundColor: primaryColor }}
              >
                <h3 className="text-2xl sm:text-3xl font-black">
                  {requestedPage.sectionsJson?.cta?.title || `Need Assistance with ${requestedPage.title}?`}
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
                    <span>{requestedPage.sectionsJson?.cta?.buttonText || "Connect via WhatsApp"}</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-black text-slate-800">Page Not Found</h2>
            <p className="text-xs text-slate-500">This custom page has either been moved or deleted.</p>
            <Link
              href={`/site/${domainOrSlug}`}
              className="inline-block px-6 py-2.5 rounded-xl font-bold text-xs text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Return to Home
            </Link>
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
                {hero.title || vendor.businessName}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {hero.subtitle || "Premium quality and personalized customer service."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={hero.buttonLink || whatsappUrl}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{hero.buttonText || "Book via WhatsApp"}</span>
                </a>
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-100 transition-all"
                >
                  <span>View Products</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
                {hero.bgImage ? (
                  <Image src={hero.bgImage} alt="Hero" fill className="object-cover" priority />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400 p-6 text-center">
                    <ShoppingBag className="w-16 h-16 mb-2 opacity-40" />
                    <span className="text-xs uppercase font-bold tracking-widest">{vendor.businessName}</span>
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
          <div className="mb-12">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {((services.items && services.items.length > 0)
              ? services.items
              : (products && products.length > 0
                  ? products.slice(0, 4).map((p: any) => ({
                      name: p.title || p.name,
                      price: p.price != null ? `Rs. ${Number(p.price).toLocaleString()}` : "Contact for price",
                      imageUrl: p.image || p.images?.[0],
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
      {config?.productsSection?.enabled !== false && (
        <section id="products" className="py-20 bg-slate-50/50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5" style={{ color: primaryColor }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{config?.productsSection?.badge || "STORE INVENTORY"}</span>
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                {config?.productsSection?.title || "Direct From Our Store"}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {config?.productsSection?.subtitle || "Browse verified catalog items and order directly via WhatsApp or visit our physical store."}
              </p>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((p: any, idx: number) => {
                  const title = p.title || p.name || `Product #${idx + 1}`;
                  const price = p.price != null && p.price !== ""
                    ? `Rs. ${Number(p.price).toLocaleString()}`
                    : (p.type === "AD" ? "Contact for price" : "Rs. 0");
                  const img = p.image || p.images?.[0];

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
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{title}</h4>
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
      {about.enabled && (
        <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                ABOUT US
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                {about.title || "Our Story"}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {about.content || "Dedicated to providing the best products and experiences."}
              </p>
            </div>

            <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden relative border shadow-lg">
              {about.images?.[0] ? (
                <Image src={about.images[0]} alt="About" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  About Us
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )}

      {/* ── Footer / Contact ── */}
      <footer id="contact" className="bg-slate-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              GET IN TOUCH
            </span>
            <h3 className="text-3xl font-black tracking-tight">Visit Us or Connect</h3>
            <div className="space-y-2 text-sm text-slate-400 pt-2">
              {contact.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{contact.address}</span>
                </div>
              )}
              {(contact.phone || vendor.phone) && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{contact.phone || vendor.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center space-y-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-black text-sm shadow-xl hover:opacity-95 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{config?.headerSection?.buttonText || "Book via WhatsApp"}</span>
            </a>

            {/* Social Links */}
            {(footer?.socialLinks?.facebook || footer?.socialLinks?.instagram) && (
              <div className="flex items-center gap-3 pt-1">
                {footer.socialLinks?.facebook && (
                  <a
                    href={footer.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    Facebook
                  </a>
                )}
                {footer.socialLinks?.instagram && (
                  <a
                    href={footer.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500">
              {footer?.copyrightText || `© ${new Date().getFullYear()} ${vendor?.businessName || "Store"}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
