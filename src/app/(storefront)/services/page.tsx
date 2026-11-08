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
  MapPin,
  Car,
  RefreshCw,
} from "lucide-react";
import { SL_LOCATIONS } from "@/lib/ads-locations";
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
  const locationParam = searchParams.get("location") || "all";
  const deliveryTypeParam = searchParams.get("deliveryType") || "all";
  const sortByParam = searchParams.get("sortBy") || "newest";
  const shopParam = searchParams.get("shop") || "all";

  const [providers, setProviders] = useState<{ vendors: any[]; adsSellers: any[] }>({
    vendors: [],
    adsSellers: [],
  });

  const districtList = Object.keys(SL_LOCATIONS);
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
      if (locationParam && locationParam !== "all") {
        params.set("location", locationParam);
      }
      if (deliveryTypeParam && deliveryTypeParam !== "all") {
        params.set("deliveryType", deliveryTypeParam);
      }
      if (shopParam && shopParam !== "all") {
        params.set("shop", shopParam);
      }
      if (sortByParam) params.set("sortBy", sortByParam);
      params.set("page", String(pagination.page));
      params.set("limit", "12");

      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data.services || []);
        setPagination(data.data.pagination);
        if (data.data.providers) {
          setProviders(data.data.providers);
        }
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
  }, [selectedCategoryId, searchParam, priceTypeParam, locationParam, deliveryTypeParam, sortByParam, shopParam, pagination.page]);

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

  // Find active shop filter label
  const activeShopLabel = useMemo(() => {
    if (!shopParam || shopParam === "all") return null;
    if (shopParam === "type:vendor") return "Vendors Only";
    if (shopParam === "type:adsseller") return "Ads Sellers Only";
    if (shopParam.startsWith("vendor:")) {
      const id = shopParam.replace("vendor:", "");
      const v = providers.vendors.find((item) => item.id === id);
      return v ? `Vendor: ${v.businessName}` : "Vendor Store";
    }
    if (shopParam.startsWith("adsseller:")) {
      const id = shopParam.replace("adsseller:", "");
      const s = providers.adsSellers.find((item) => item.id === id);
      return s ? `Ads Seller: ${s.businessName}` : "Ads Seller";
    }
    return shopParam;
  }, [shopParam, providers]);

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
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#FF6600]" />
              <span>Found {pagination.total} service(s)</span>
            </div>
            {activeShopLabel && (
              <Badge
                variant="secondary"
                className="bg-orange-50 dark:bg-orange-950/40 text-[#FF6600] border border-orange-200 dark:border-orange-800 text-[11px] font-bold flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg"
              >
                <span>Shop: {activeShopLabel}</span>
                <button
                  type="button"
                  onClick={() => updateQuery("shop", "all")}
                  className="hover:bg-orange-200/50 dark:hover:bg-orange-800/50 rounded p-0.5 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Shop / Provider Filter (Vendor or Ads Seller) */}
            <Select
              value={shopParam}
              onValueChange={(val) => updateQuery("shop", val)}
            >
              <SelectTrigger className="h-9 w-40 sm:w-52 text-xs bg-card">
                <Store className="w-3.5 h-3.5 mr-1 text-[#FF6600] shrink-0" />
                <SelectValue placeholder="All Providers / Shops" />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl">
                <SelectItem value="all">🏬 All Providers / Shops</SelectItem>
                <SelectItem value="type:vendor" className="font-semibold text-blue-600 dark:text-blue-400">
                  🏪 Vendors Only
                </SelectItem>
                <SelectItem value="type:adsseller" className="font-semibold text-purple-600 dark:text-purple-400">
                  📢 Ads Sellers Only
                </SelectItem>

                {providers.vendors.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-muted/40 mt-1">
                      Vendors &amp; Stores ({providers.vendors.length})
                    </div>
                    {providers.vendors.map((v) => (
                      <SelectItem key={v.id} value={`vendor:${v.id}`} className="text-xs">
                        🏪 {v.businessName}
                      </SelectItem>
                    ))}
                  </>
                )}

                {providers.adsSellers.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-muted/40 mt-1">
                      Ads &amp; Classified Sellers ({providers.adsSellers.length})
                    </div>
                    {providers.adsSellers.map((s) => (
                      <SelectItem key={s.id} value={`adsseller:${s.id}`} className="text-xs">
                        📢 {s.businessName}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Location / District Filter */}
            <Select
              value={locationParam}
              onValueChange={(val) => updateQuery("location", val)}
            >
              <SelectTrigger className="h-9 w-36 sm:w-44 text-xs bg-card">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#FF6600] shrink-0" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="max-h-64 rounded-xl">
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Islandwide" className="font-semibold text-[#FF6600]">
                  🇱🇰 Islandwide
                </SelectItem>
                {districtList.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delivery Option Filter */}
            <Select
              value={deliveryTypeParam}
              onValueChange={(val) => updateQuery("deliveryType", val)}
            >
              <SelectTrigger className="h-9 w-36 sm:w-44 text-xs bg-card">
                <SelectValue placeholder="Delivery Option" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Delivery Options</SelectItem>
                <SelectItem value="DOORSTEP">🚗 Doorstep / Home Visit</SelectItem>
                <SelectItem value="AT_VENDOR">🏢 At Store / Workshop</SelectItem>
                <SelectItem value="BOTH">🔄 Both Available</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Type Filter */}
            <Select
              value={priceTypeParam}
              onValueChange={(val) => updateQuery("priceType", val)}
            >
              <SelectTrigger className="h-9 w-32 sm:w-36 text-xs bg-card">
                <SelectValue placeholder="Price Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
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
              <SelectTrigger className="h-9 w-34 sm:w-40 text-xs bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
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
                      <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF6600]" />
                        {svc.duration}
                      </div>
                    )}

                    {/* Bottom-left: Location Pill */}
                    {(svc.city || svc.district) && (
                      <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 max-w-[140px]">
                        <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="truncate">
                          {[svc.city, svc.district].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Bottom-right: Delivery Type Pill */}
                    {svc.deliveryType && (
                      <div className="absolute bottom-2.5 right-2.5 shadow-sm">
                        {svc.deliveryType === "DOORSTEP" ? (
                          <span className="bg-sky-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Car className="w-2.5 h-2.5" /> Doorstep
                          </span>
                        ) : svc.deliveryType === "AT_VENDOR" ? (
                          <span className="bg-amber-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" /> In-Store
                          </span>
                        ) : svc.deliveryType === "BOTH" ? (
                          <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" /> Store & Home
                          </span>
                        ) : null}
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Provider Row */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Store className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
                        <button
                          type="button"
                          onClick={() => {
                            const val = svc.vendor ? `vendor:${svc.vendor.id}` : svc.adsSeller ? `adsseller:${svc.adsSeller.id}` : "all";
                            if (val !== "all") updateQuery("shop", val);
                          }}
                          className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#FF6600] dark:hover:text-[#FF6600] truncate text-left transition-colors"
                          title={`Filter by ${providerName}`}
                        >
                          {providerName}
                        </button>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      </div>

                      {/* Title */}
                      <Link
                        href={`/services/${svc.slug || svc.id}`}
                        className="font-bold text-sm text-foreground hover:text-[#FF6600] line-clamp-2 transition-colors leading-snug"
                      >
                        {svc.name}
                      </Link>

                      {/* Location & Coverage Row */}
                      {(svc.district || svc.city || svc.serviceArea) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 mb-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6600] shrink-0" />
                          <span className="truncate font-medium text-slate-600 dark:text-slate-400">
                            {[svc.city, svc.district].filter(Boolean).join(", ") || svc.district}
                            {svc.serviceArea && ` • ${svc.serviceArea}`}
                          </span>
                        </div>
                      )}

                      {/* Short Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
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

                      {/* Beautiful Action Buttons: WhatsApp / Inquire */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenWhatsApp(svc)}
                          className="bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 h-9"
                          title="Inquire directly on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 fill-white/20" />
                          <span>WhatsApp</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInquiryModal(svc)}
                          className="bg-orange-50/80 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 active:scale-[0.98] text-[#FF6600] border-orange-200 dark:border-orange-900/60 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 h-9"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Inquire</span>
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

