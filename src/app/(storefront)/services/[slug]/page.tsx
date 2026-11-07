"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Store,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Sparkles,
  Loader2,
  MapPin,
  Car,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [service, setService] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Inquiry Form Modal State
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [contactMethod, setContactMethod] = useState("WHATSAPP");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/services/${resolvedParams.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setService(data.data);
          const firstImg =
            data.data.images && data.data.images.length > 0
              ? data.data.images[0]
              : data.data.category?.image || null;
          setSelectedImage(firstImg);
          setInquiryMessage(
            `Hello, I saw your service "${data.data.name}" on TryMe.lk. Please let me know details regarding your pricing, availability, and scheduling.`
          );
        } else {
          toast({
            variant: "destructive",
            title: "Service not found",
            description: data.error || "This service is currently unavailable.",
          });
        }
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Network Error",
          description: err.message,
        });
      })
      .finally(() => setIsLoading(false));
  }, [resolvedParams.slug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
        <p className="text-sm text-muted-foreground font-medium">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF6600] flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Service Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The service you are looking for does not exist or has been removed from TryMe.lk Marketplace.
        </p>
        <Button
          onClick={() => router.push("/services")}
          className="mt-6 bg-[#FF6600] hover:bg-[#e65c00] text-white"
        >
          Browse All Services
        </Button>
      </div>
    );
  }

  const provider = service.vendor || service.adsSeller;
  const providerName = provider?.businessName || "TryMe Provider";
  const phone = service.vendor?.businessPhone || service.adsSeller?.phone || "";
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // Format pricing
  let priceFormatted = "Contact for Price";
  if (service.priceType === "FIXED" && service.price != null) {
    priceFormatted = `Rs. ${Number(service.price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;
  } else if (service.priceType === "STARTING_FROM" && service.price != null) {
    priceFormatted = `Starting from Rs. ${Number(service.price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })}`;
  } else if (service.priceType === "HOURLY" && service.price != null) {
    priceFormatted = `Rs. ${Number(service.price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    })} / hr`;
  }

  // Open WhatsApp
  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${providerName}, I found your service "${service.name}" on TryMe.lk Marketplace and would like to inquire about booking/details.`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, "_blank");
  };

  // Submit Inquiry
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Your name is required." });
      return;
    }
    if (!customerPhone.trim() && !customerEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide either a phone number or email.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/services/${service.id}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          message: inquiryMessage.trim(),
          preferredChannel: contactMethod,
          source: "TRYME_MARKETPLACE",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Inquiry Sent Successfully!",
        description: `Your inquiry has been submitted to ${providerName}. The provider has received your details and will get back to you shortly.`,
      });

      setIsInquiryModalOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to send inquiry",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
          {service.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/services?categoryId=${service.category.id}`}
                className="hover:text-foreground"
              >
                {service.category.name}
              </Link>
            </>
          )}
          {service.subCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/services?categoryId=${service.subCategory.id}`}
                className="hover:text-foreground"
              >
                {service.subCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-semibold truncate max-w-[200px]">
            {service.name}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery & Description (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Featured Image */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={service.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                  <Briefcase className="w-16 h-16 mb-2" />
                  <span className="text-xs">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {service.images && service.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {service.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === img
                        ? "border-[#FF6600] ring-2 ring-[#FF6600]/30 scale-102"
                        : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${service.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Full Service Description Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-foreground">Service Details & Description</h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {service.description}
              </div>

              {/* Key Features / Inclusions */}
              {service.features && service.features.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    What&apos;s Included & Key Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {service.features.map((feat: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, Provider, and Action Buttons (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Action Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-sm space-y-5">
              {/* Category Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-[#FF6600] border-orange-200 font-bold text-xs px-2.5 py-0.5"
                >
                  {service.category?.name || "Service"}
                </Badge>
                {service.subCategory && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    {service.subCategory.name}
                  </Badge>
                )}
                {service.duration && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="w-3.5 h-3.5 text-[#FF6600]" />
                    {service.duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                {service.name}
              </h1>

              {/* Short Excerpt */}
              {service.shortDesc && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.shortDesc}
                </p>
              )}

              {/* Pricing Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Service Rate
                </span>
                <span className="text-2xl md:text-3xl font-extrabold text-[#FF6600] mt-1 block">
                  {priceFormatted}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Services are booked directly via WhatsApp or inquiry without online checkout.
                </p>
              </div>

              {/* Service Fulfilment & Location Card */}
              <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6600]" />
                  Service Fulfilment & Location
                </span>

                {/* Delivery Mode Banner */}
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  {service.deliveryType === "DOORSTEP" ? (
                    <>
                      <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold block text-foreground">Doorstep Service Available</span>
                        <span className="text-muted-foreground text-[11px]">Provider visits your home or office location.</span>
                      </div>
                    </>
                  ) : service.deliveryType === "AT_VENDOR" ? (
                    <>
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold block text-foreground">In-Store / Studio Service</span>
                        <span className="text-muted-foreground text-[11px]">Customer visits provider&apos;s workshop or store.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold block text-foreground">Flexible: Store & Doorstep Options</span>
                        <span className="text-muted-foreground text-[11px]">You can visit the provider, or request a home visit.</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Location & Coverage */}
                {(service.district || service.city || service.serviceArea) && (
                  <div className="pt-2 border-t border-orange-200/60 dark:border-orange-900/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <span>Area:</span>
                      <span>{[service.city, service.district].filter(Boolean).join(", ") || service.district}</span>
                    </div>
                    {service.serviceArea && (
                      <p className="text-[11px] text-muted-foreground">
                        Coverage: {service.serviceArea}
                      </p>
                    )}
                    {service.address && (service.deliveryType === "AT_VENDOR" || service.deliveryType === "BOTH") && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Address: {service.address}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* WhatsApp Button */}
                <Button
                  onClick={handleOpenWhatsApp}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md h-12 text-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat & Inquire via WhatsApp
                </Button>

                {/* Send Direct Inquiry Button */}
                <Button
                  onClick={() => setIsInquiryModalOpen(true)}
                  size="lg"
                  variant="outline"
                  className="w-full border-[#FF6600] text-[#FF6600] hover:bg-orange-50 hover:text-[#FF6600] font-bold rounded-xl h-12 text-sm flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Send Direct Inquiry Form
                </Button>

                {/* Phone Call (if available) */}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Phone className="w-4 h-4 text-slate-500" />
                    Call Provider Directly ({phone})
                  </a>
                )}
              </div>

              {/* Safety & Guarantee Badge */}
              <div className="pt-4 border-t flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>TryMe Verified Provider:</strong> All vendors and sellers are registered businesses on TryMe.lk. Directly discuss requirements, milestones, and payment preferences.
                </p>
              </div>
            </div>

            {/* Provider Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  About The Provider
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border bg-slate-100 overflow-hidden relative flex items-center justify-center shrink-0">
                  {provider?.logo ? (
                    <Image
                      src={provider.logo}
                      alt={providerName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    {providerName}
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  </h4>
                  {provider?.businessAddress && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {provider.businessAddress}
                    </p>
                  )}
                </div>
              </div>

              {provider?.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {provider.description}
                </p>
              )}

              {provider?.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-semibold rounded-xl"
                >
                  <Link
                    href={
                      service.vendor
                        ? `/vendors/${provider.slug}`
                        : `/site/${provider.slug}`
                    }
                  >
                    View Seller Profile & Other Offerings
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Form Modal */}
      <Dialog open={isInquiryModalOpen} onOpenChange={setIsInquiryModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF6600]" />
              Inquire About Service
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send your inquiry to <strong>{providerName}</strong> regarding &quot;
              <strong>{service.name}</strong>&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitInquiry} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label htmlFor="cust-name" className="text-xs font-bold uppercase text-muted-foreground">
                Your Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cust-name"
                placeholder="e.g. Kasun Perera"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cust-phone" className="text-xs font-bold uppercase text-muted-foreground">
                  Phone / WhatsApp <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  placeholder="077 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cust-email" className="text-xs font-bold uppercase text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="you@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cust-msg" className="text-xs font-bold uppercase text-muted-foreground">
                Message / Job Details
              </Label>
              <Textarea
                id="cust-msg"
                rows={3}
                placeholder="Explain the service you need..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Preferred Reply Channel
              </Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select contact channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="PHONE">Direct Phone Call</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground">
              🛡️ The inquiry will be recorded with <strong>TryMe.lk Marketplace</strong> as its origin source. The provider will reach back to you directly.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInquiryModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  "Submit Inquiry"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

