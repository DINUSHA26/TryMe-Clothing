"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Search,
  MessageCircle,
  Mail,
  Phone,
  Store,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ServiceCategoryCircleHierarchy,
  ServiceCatItem,
} from "@/components/services/ServiceCategoryCircleHierarchy";

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ServiceCatItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // URL State
  const selectedCategoryId = searchParams.get("categoryId") || "all";
  const searchParam = searchParams.get("search") || "";
  const priceTypeParam = searchParams.get("priceType") || "all";
  const sortByParam = searchParams.get("sortBy") || "newest";

  const [searchInput, setSearchInput] = useState(searchParam);

  // Inquiry Modal State
  const [inquiryModalService, setInquiryModalService] = useState<any | null>(null);
  const [inquiryCustomerName, setInquiryCustomerName] = useState("");
  const [inquiryCustomerPhone, setInquiryCustomerPhone] = useState("");
  const [inquiryCustomerEmail, setInquiryCustomerEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryChannel, setInquiryChannel] = useState("WHATSAPP");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Fetch Categories
  useEffect(() => {
    fetch("/api/admin/services/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const activeCats = data.data
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              image: c.image,
              icon: c.icon,
              subCategories: (c.subCategories || [])
                .filter((s: any) => s.isActive !== false)
                .map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  image: s.image,
                  icon: s.icon,
                })),
            }));
          setCategories(activeCats);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Services
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId && selectedCategoryId !== "all") {
        params.set("categoryId", selectedCategoryId);
      }
      if (searchParam) params.set("search", searchParam);
      if (priceTypeParam && priceTypeParam !== "all") {
        params.set("priceType", priceTypeParam);
      }
      if (sortByParam) params.set("sortBy", sortByParam);
      params.set("page", String(pagination.page));
      params.set("limit", "12");

      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data.services || []);
        setPagination(data.data.pagination);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load services",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategoryId, searchParam, priceTypeParam, sortByParam, pagination.page]);

  // Update URL params
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/services?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery("search", searchInput.trim());
  };

  const handleSelectCategory = (catId: string) => {
    updateQuery("categoryId", catId);
  };

  // Find active category label
  const activeCategoryTitle = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === "all") return "ALL SERVICES";
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat) return cat.name.toUpperCase();
    for (const c of categories) {
      const sub = c.subCategories?.find((s) => s.id === selectedCategoryId);
      if (sub) return `${c.name.toUpperCase()} / ${sub.name.toUpperCase()}`;
    }
    return "SERVICES";
  }, [categories, selectedCategoryId]);

  // WhatsApp quick trigger
  const handleOpenWhatsApp = (service: any) => {
    const provider = service.vendor || service.adsSeller;
    const phone = service.vendor?.businessPhone || service.adsSeller?.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const providerName = provider?.businessName || "Provider";

    const text = encodeURIComponent(
      `Hello ${providerName}, I found your service "${service.name}" on TryMe.lk Marketplace and would like to inquire about booking/details.`
    );

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(waUrl, "_blank");
  };

  // Submit Inquiry Dialog
  const handleOpenInquiryModal = (service: any) => {
    setInquiryModalService(service);
    setInquiryMessage(`Hello, I am interested in your service "${service.name}". Please provide more details regarding pricing, availability, and scheduling.`);
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryCustomerName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Your name is required." });
      return;
    }
    if (!inquiryCustomerPhone.trim() && !inquiryCustomerEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide either a phone number or email so the provider can contact you.",
      });
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const res = await fetch(`/api/services/${inquiryModalService.id}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: inquiryCustomerName.trim(),
          customerPhone: inquiryCustomerPhone.trim(),
          customerEmail: inquiryCustomerEmail.trim(),
          message: inquiryMessage.trim(),
          preferredChannel: inquiryChannel,
          source: "TRYME_MARKETPLACE",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Inquiry Sent!",
        description: `Your inquiry has been sent to ${
          inquiryModalService.vendor?.businessName ||
          inquiryModalService.adsSeller?.businessName ||
          "the provider"
        }. They will get in touch with you shortly.`,
      });

      setInquiryModalService(null);
      setInquiryCustomerName("");
      setInquiryCustomerPhone("");
      setInquiryCustomerEmail("");
      setInquiryMessage("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to send inquiry",
        description: err.message,
      });
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Top Banner / Title Header */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground uppercase">
                {activeCategoryTitle}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Browse verified professional services, skilled technicians, and bespoke solutions from TryMe sellers.
              </p>
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 w-full md:w-96"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services, skills, providers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200"
                />
              </div>
              <Button
                type="submit"
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-semibold shrink-0"
              >
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Circular Category Avatars Row (Shop by Category Style) */}
      <div className="container mx-auto px-4 pt-4">
        <ServiceCategoryCircleHierarchy
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-16">
        {/* Filter & Sorting Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-3.5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter className="w-4 h-4 text-[#FF6600]" />
            <span>Found {pagination.total} service(s)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Price Type Filter */}
            <Select
              value={priceTypeParam}
              onValueChange={(val) => updateQuery("priceType", val)}
            >
              <SelectTrigger className="h-9 w-36 text-xs bg-card">
                <SelectValue placeholder="Price Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pricing</SelectItem>
                <SelectItem value="FIXED">Fixed Price</SelectItem>
                <SelectItem value="STARTING_FROM">Starting From</SelectItem>
                <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                <SelectItem value="CONTACT_FOR_PRICE">Contact for Price</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select
              value={sortByParam}
              onValueChange={(val) => updateQuery("sortBy", val)}
            >
              <SelectTrigger className="h-9 w-40 text-xs bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Alphabetical (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border p-4 space-y-3 animate-pulse shadow-sm"
              >
                <div className="w-full aspect-[4/3] bg-muted rounded-xl" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded mt-4" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border p-12 text-center max-w-lg mx-auto shadow-sm my-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF6600] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No services listed yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No services match your active filters or category selection. Try resetting filters or searching for another service.
            </p>
            <Button
              onClick={() => router.push("/services")}
              className="mt-5 bg-[#FF6600] hover:bg-[#e65c00] text-white"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((svc) => {
              const provider = svc.vendor || svc.adsSeller;
              const providerName = provider?.businessName || "TryMe Provider";
              const primaryImage =
                svc.images && svc.images.length > 0
                  ? svc.images[0]
                  : svc.category?.image || null;

              // Format price display
              let priceDisplay = "Contact for Price";
              if (svc.priceType === "FIXED" && svc.price != null) {
                priceDisplay = `Rs. ${Number(svc.price).toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                })}`;
              } else if (svc.priceType === "STARTING_FROM" && svc.price != null) {
                priceDisplay = `From Rs. ${Number(svc.price).toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                })}`;
              } else if (svc.priceType === "HOURLY" && svc.price != null) {
                priceDisplay = `Rs. ${Number(svc.price).toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                })} / hr`;
              }

              return (
                <div
                  key={svc.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                >
                  {/* Service Image */}
                  <Link
                    href={`/services/${svc.slug || svc.id}`}
                    className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden block"
                  >
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={svc.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                        <Briefcase className="w-12 h-12 mb-1" />
                        <span className="text-[10px]">No Image</span>
                      </div>
                    )}

                    {/* Category Pill Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                        {svc.subCategory?.name || svc.category?.name || "Service"}
                      </span>
                    </div>

                    {/* Duration badge if exists */}
                    {svc.duration && (
                      <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF6600]" />
                        {svc.duration}
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Provider Row */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Store className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {providerName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      </div>

                      {/* Title */}
                      <Link
                        href={`/services/${svc.slug || svc.id}`}
                        className="font-bold text-sm text-foreground hover:text-[#FF6600] line-clamp-2 transition-colors leading-snug"
                      >
                        {svc.name}
                      </Link>

                      {/* Short Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                        {svc.shortDesc || svc.description}
                      </p>

                      {/* Features preview */}
                      {svc.features && svc.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {svc.features.slice(0, 2).map((feat: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price and CTA Buttons */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="mb-2.5">
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          Pricing
                        </span>
                        <span className="text-base font-extrabold text-[#FF6600]">
                          {priceDisplay}
                        </span>
                      </div>

                      {/* Action buttons: WhatsApp / Inquire */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenWhatsApp(svc)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm h-8.5"
                          title="Inquire directly on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInquiryModal(svc)}
                          className="border-slate-300 dark:border-slate-700 hover:bg-orange-50 hover:text-[#FF6600] hover:border-orange-200 font-semibold text-xs rounded-xl h-8.5"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          Inquire
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Service Inquiry Modal */}
      <Dialog
        open={!!inquiryModalService}
        onOpenChange={(open) => !open && setInquiryModalService(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF6600]" />
              Inquire About Service
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inquiryModalService && (
                <span>
                  Submit an inquiry for &quot;<strong>{inquiryModalService.name}</strong>&quot; by{" "}
                  <strong>
                    {inquiryModalService.vendor?.businessName ||
                      inquiryModalService.adsSeller?.businessName}
                  </strong>
                  .
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {inquiryModalService && (
            <form onSubmit={handleSubmitInquiry} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label htmlFor="inq-name" className="text-xs font-bold uppercase text-muted-foreground">
                  Your Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="inq-name"
                  placeholder="e.g., Kasun Perera"
                  value={inquiryCustomerName}
                  onChange={(e) => setInquiryCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="inq-phone" className="text-xs font-bold uppercase text-muted-foreground">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="inq-phone"
                    placeholder="077 123 4567"
                    value={inquiryCustomerPhone}
                    onChange={(e) => setInquiryCustomerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inq-email" className="text-xs font-bold uppercase text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="inq-email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={inquiryCustomerEmail}
                    onChange={(e) => setInquiryCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inq-msg" className="text-xs font-bold uppercase text-muted-foreground">
                  Your Inquiry / Job Details
                </Label>
                <Textarea
                  id="inq-msg"
                  rows={3}
                  placeholder="Explain what work or service you need done..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Preferred Contact Method
                </Label>
                <Select value={inquiryChannel} onValueChange={setInquiryChannel}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Choose contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp Message</SelectItem>
                    <SelectItem value="PHONE">Direct Phone Call</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground">
                🛡️ Your inquiry is sent directly to the verified provider. The provider will view this as a <strong>TryMe.lk Marketplace</strong> inquiry in their seller dashboard.
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInquiryModalService(null)}
                  disabled={isSubmittingInquiry}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-semibold"
                >
                  {isSubmittingInquiry ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Sending...
                    </>
                  ) : (
                    "Send Inquiry to Provider"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
