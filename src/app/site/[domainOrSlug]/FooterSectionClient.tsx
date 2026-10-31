"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface FooterSectionClientProps {
  footer: any;
  contact: any;
  vendor: any;
  primaryColor: string;
  pages: any[];
  visibleNavItems: any[];
  domainOrSlug: string;
  entityType?: string;
}

export default function FooterSectionClient({
  footer,
  contact,
  vendor,
  primaryColor,
  pages,
  visibleNavItems,
  domainOrSlug,
  entityType,
}: FooterSectionClientProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  if (footer?.enabled === false) return null;

  const currentYear = new Date().getFullYear();
  const storeName = vendor?.businessName || "Store";
  const storeBio =
    footer?.storeBio ||
    vendor?.tagline ||
    "High quality products and dedicated customer service in Sri Lanka.";

  const showQuickLinks = footer?.showQuickLinks !== false;
  const showPagesLinks = footer?.showPagesLinks !== false;
  const showContactInfo = footer?.showContactInfo !== false;
  const showNewsletter = Boolean(footer?.showNewsletter);

  const social = footer?.socialLinks || {};

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      setNewsletterMsg("Please enter a valid email address.");
      setNewsletterStatus("error");
      return;
    }

    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterStatus("success");
        setNewsletterMsg("Thank you for subscribing!");
        setNewsletterEmail("");
      } else {
        setNewsletterStatus("error");
        setNewsletterMsg(data.error || "Subscription failed.");
      }
    } catch (e: any) {
      setNewsletterStatus("error");
      setNewsletterMsg("Failed to subscribe. Please try again.");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: Store Brand & Socials (Col span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {vendor?.logo ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-800 shadow-sm shrink-0">
                  <Image src={vendor.logo} alt="Logo" fill className="object-cover" />
                </div>
              ) : (
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {storeName.charAt(0) || "S"}
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight text-white">{storeName}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {storeBio}
            </p>

            {/* Social Icons Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Facebook
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  TikTok
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  YouTube
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Twitter / X
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links (Website Sections) */}
          {showQuickLinks && (
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Explore
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                {visibleNavItems.map((item: any) => {
                  const href =
                    item.type === "page"
                      ? `/site/${domainOrSlug}?page=${item.target}`
                      : `/site/${domainOrSlug}#${item.target}`;
                  return (
                    <li key={item.id || item.target}>
                      <Link
                        href={href}
                        className="hover:text-white transition-colors hover:underline block"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Column 3: Custom Pages & Policies */}
          {showPagesLinks && (
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Customer Care &amp; Pages
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                {pages && pages.length > 0 ? (
                  pages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/site/${domainOrSlug}?page=${p.slug}`}
                        className="hover:text-white transition-colors hover:underline block"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link href={`/site/${domainOrSlug}#about`} className="hover:text-white transition-colors">
                        About Our Store
                      </Link>
                    </li>
                    <li>
                      <Link href={`/site/${domainOrSlug}#contact`} className="hover:text-white transition-colors">
                        Store Location &amp; Contact
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Column 4: Contact Summary & Newsletter */}
          <div className={`${showQuickLinks && showPagesLinks ? "lg:col-span-3" : "lg:col-span-5"} space-y-4`}>
            {showContactInfo && (
              <div className="space-y-2 text-xs text-slate-400">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  Store Contact
                </h4>
                {contact?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{contact.address}</span>
                  </div>
                )}
                {(contact?.phone || vendor?.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{contact.phone || vendor.phone}</span>
                  </div>
                )}
                {contact?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Newsletter Subscription Box */}
            {showNewsletter && (
              <div className="pt-2 space-y-2">
                <h5 className="text-xs font-extrabold text-white">
                  {footer?.newsletterTitle || "Subscribe to Our Newsletter"}
                </h5>
                <p className="text-[11px] text-slate-400">
                  {footer?.newsletterSubtitle || "Get special offers, new arrival alerts, and exclusive discounts."}
                </p>

                {newsletterStatus === "success" ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{newsletterMsg}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
                      />
                      <button
                        type="submit"
                        disabled={newsletterStatus === "loading"}
                        className="px-3.5 py-2 rounded-xl text-white font-bold text-xs uppercase shadow-xs transition-opacity hover:opacity-90 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {newsletterStatus === "error" && (
                      <p className="text-[10px] text-rose-400">{newsletterMsg}</p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {footer?.copyrightText || `© ${currentYear} ${storeName}. All rights reserved.`}
          </p>

          <div className="flex items-center gap-6">
            <span className="text-[11px] text-slate-600">
              Powered by <strong className="text-slate-400 font-bold">TryMe Stores</strong>
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
