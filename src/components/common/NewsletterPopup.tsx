"use client";

import { useEffect, useState } from "react";
import { X, Facebook, Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed or submitted the popup in the last 24 hours
    const lastDismissed = localStorage.getItem("tryme_newsletter_popup_dismissed");
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      if (now - dismissedTime < oneDayInMs) {
        return; // Don't show if within 24 hours
      }
    }

    // Set a timer to show the popup after 10 seconds (10000ms)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("tryme_newsletter_popup_dismissed", Date.now().toString());
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        localStorage.setItem("tryme_newsletter_popup_dismissed", Date.now().toString());
        // Automatically close the popup after 2.5 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 2500);
      } else {
        throw new Error(data.error || "Failed to subscribe.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity duration-300">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Modal Card container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300 md:h-[480px]">
        
        {/* Close Icon Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-slate-700 md:text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Modern Fashion Image */}
        <div className="relative w-full md:w-1/2 h-48 md:h-full bg-slate-100 hidden md:block">
          <Image
            src="/images/newsletter_promo.png"
            alt="Fashion New Arrivals"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
          {/* Logo overlay on top-right of image, background removed and made larger */}
          <div className="absolute top-6 right-6 pointer-events-none">
            <Image
              src="/logo.png"
              alt="Try Me Logo"
              width={120}
              height={38}
              className="object-contain"
            />
          </div>
          {/* Elegant Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Right Side: Subscription Form / Content */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white relative">
          
          {success ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in duration-300">
              {/* Checkmark Circle */}
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">THANK YOU!</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                You have successfully joined our mailing list. Get ready for exclusive offers and updates!
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div className="my-auto space-y-6">
                
                {/* Mobile Logo Branding - background removed and made larger */}
                <div className="flex md:hidden justify-center mb-2">
                  <Image
                    src="/logo.png"
                    alt="Try Me Logo"
                    width={130}
                    height={40}
                    className="object-contain"
                  />
                </div>

                {/* Headers */}
                <div className="space-y-2 text-center">
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-wider text-slate-800 uppercase">
                    Join <span className="text-[#ff6b00]">tryme.lk</span> Mailing List
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                    Sign Up for exclusive updates, new arrivals & insider only discounts
                  </p>
                </div>

                {/* Subscription Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="enter your email address"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 text-center text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 text-center font-medium">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#0d2366] text-white font-bold tracking-widest text-xs uppercase rounded-lg hover:bg-[#091a4f] active:bg-[#050f30] transition-colors duration-200 shadow-sm flex items-center justify-center min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </button>
                </form>

                {/* Social media icons */}
                <div className="flex items-center justify-center space-x-6 pt-2">
                  <a
                    href="https://web.facebook.com/profile.php?id=100075711233681"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/fashion__dora"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-pink-600 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@fashion_dora"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-black transition-colors"
                    aria-label="TikTok"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* No Thanks Dismiss Link */}
              <button
                onClick={handleDismiss}
                className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline transition-colors focus:outline-none"
              >
                No, Thanks
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
