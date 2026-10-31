"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface ContactSectionClientProps {
  contact: any;
  vendor: any;
  primaryColor: string;
  whatsappUrl: string;
}

export default function ContactSectionClient({
  contact,
  vendor,
  primaryColor,
  whatsappUrl,
}: ContactSectionClientProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (contact?.enabled === false) return null;

  const phone = contact?.phone || vendor?.phone || vendor?.businessPhone || "";
  const whatsappNumber = contact?.whatsapp || phone;
  const cleanWhatsapp = (whatsappNumber || "").replace(/[^0-9]/g, "");
  const email = contact?.email || vendor?.businessEmail || vendor?.email || "";
  const address = contact?.address || vendor?.businessAddress || "";

  const openingHours =
    contact?.openingHours ||
    "Monday – Saturday: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 5:00 PM";
  const showOpeningHours = contact?.showOpeningHours !== false;
  const showMap = Boolean(contact?.showMap);
  const showContactForm = contact?.showContactForm !== false;

  const mapEmbedUrl =
    contact?.mapEmbedUrl ||
    (address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : "");
  const directionsUrl =
    contact?.mapDirectionsUrl ||
    (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (!formData.phone.trim() && !formData.email.trim())) {
      alert("Please enter your name and phone number or email.");
      return;
    }

    setIsSubmitting(true);
    // Simulate sending inquiry to vendor
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleSendViaWhatsApp = () => {
    if (!cleanWhatsapp) return;
    const text = encodeURIComponent(
      `Hello ${vendor?.businessName || "Store"},\nMy name is ${formData.name || "Customer"}.\nPhone: ${formData.phone || "Not provided"}\n\nMessage: ${formData.message || "I am interested in your products/services."}`
    );
    window.open(`https://wa.me/${cleanWhatsapp}?text=${text}`, "_blank");
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900/60 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span
            className="text-xs font-black uppercase tracking-widest inline-block"
            style={{ color: primaryColor }}
          >
            GET IN TOUCH
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {contact?.title || "Visit Us or Connect"}
          </h2>
          <p className="text-slate-500 text-sm">
            {contact?.subtitle ||
              "We would love to assist you. Drop by our store, call us, or send an inquiry below."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info, Hours & Map */}
          <div className={`${showContactForm ? "lg:col-span-6" : "lg:col-span-8 lg:mx-auto"} space-y-6`}>
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {phone && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border shadow-xs space-y-1.5 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Phone Call</span>
                  </div>
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline block"
                  >
                    {phone}
                  </a>
                </div>
              )}

              {cleanWhatsapp && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border shadow-xs space-y-1.5 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">WhatsApp Chat</span>
                  </div>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm text-emerald-600 hover:underline block"
                  >
                    {whatsappNumber}
                  </a>
                </div>
              )}

              {email && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border shadow-xs space-y-1.5 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Email</span>
                  </div>
                  <a
                    href={`mailto:${email}`}
                    className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:underline truncate block"
                  >
                    {email}
                  </a>
                </div>
              )}

              {address && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border shadow-xs space-y-1.5 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Location</span>
                  </div>
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 line-clamp-2 block">
                    {address}
                  </span>
                </div>
              )}
            </div>

            {/* OPENING HOURS CARD */}
            {showOpeningHours && openingHours && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        Opening &amp; Working Hours
                      </h4>
                      <p className="text-[11px] text-slate-400">When you can visit us or receive orders</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Open Store
                  </span>
                </div>

                <div className="pt-2 border-t space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {openingHours.split("\n").map((line: string, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-900 last:border-none">
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        {line.split(":")[0]}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {line.split(":").slice(1).join(":") || line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GOOGLE MAP EMBED */}
            {showMap && mapEmbedUrl && (
              <div className="rounded-2xl border overflow-hidden bg-white dark:bg-slate-950 shadow-xs space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Store Location Map
                    </span>
                  </div>
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
                      style={{ color: primaryColor }}
                    >
                      <span>Get Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="w-full h-56 rounded-xl overflow-hidden border">
                  <iframe
                    title="Store Map"
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contact & Inquiry Form */}
          {showContactForm && (
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-950 border shadow-lg space-y-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                    {contact?.formTitle || "Send Us a Message"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {contact?.formSubtitle ||
                      "Fill out your details below and our team will get in touch with you promptly."}
                  </p>
                </div>

                {submitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-100">
                      Thank You!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Your message has been sent successfully. We will contact you soon.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", phone: "", email: "", message: "" });
                      }}
                      className="text-xs font-bold text-emerald-800 dark:text-emerald-200 underline pt-2 block mx-auto"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Kamal Perera"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Phone / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="07XXXXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="kamal@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Message / Requirements <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Write your question, order details, or inquiry here..."
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                      </button>

                      {cleanWhatsapp && (
                        <button
                          type="button"
                          onClick={handleSendViaWhatsApp}
                          className="py-3 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
