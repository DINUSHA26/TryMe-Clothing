"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SidebarFilters } from "@/components/products/SidebarFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Store,
  Package,
  CheckCircle2,
  Star,
  Globe,
  ExternalLink,
  Briefcase,
  Clock,
  MapPin,
  MessageCircle,
  Car,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import StoreAiAssistant from "@/components/ai-assistant/StoreAiAssistant";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  shopOpen: boolean;
  productCount: number;
  serviceCount?: number;
  services?: any[];
  businessPhone?: string;
  followerCount?: number;
  totalSells?: number;
  rating?: number;
  isFollowing?: boolean;
  websiteConfig?: any;
  customDomain?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  category?: {
    name: string;
    slug: string;
  };
  vendor?: {
    businessName: string;
    slug: string;
  };
}

function VendorStorePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState<number>(4);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const { isAuthenticated } = useAuthStore();
  const [followingLoading, setFollowingLoading] = useState(false);

  const tabParam = searchParams.get("tab");
  const [activeMainTab, setActiveMainTab] = useState<"products" | "services">(
    tabParam === "services" ? "services" : "products"
  );
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    if (tabParam === "services") {
      setActiveMainTab("services");
    } else if (tabParam === "products") {
      setActiveMainTab("products");
    }
  }, [tabParam]);

  const formatPrice = (svc: any) => {
    if (svc.priceType === "CONTACT_FOR_PRICE" || svc.price == null) {
      return "Contact for Price";
    }
    const formatted = Number(svc.price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
    });
    if (svc.priceType === "STARTING_FROM") {
      return `From Rs. ${formatted}`;
    }
    if (svc.priceType === "HOURLY") {
      return `Rs. ${formatted} / hr`;
    }
    return `Rs. ${formatted}`;
  };

  const handleWhatsAppInquiry = (svc: any) => {
    const phone = vendor?.businessPhone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Hello ${vendor?.businessName || "Store"}, I saw your service "${svc.name}" on TryMe.lk and would like to inquire about booking/details.`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, "_blank");
  };

  const formatSells = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + "M+";
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + "K+";
    if (count >= 100) return Math.floor(count / 100) * 100 + "+";
    if (count >= 10) return Math.floor(count / 10) * 10 + "+";
    return count.toString();
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please register or login first to follow this shop.");
      router.push(`/login?returnUrl=/vendors/${slug}`);
      return;
    }
    
    setFollowingLoading(true);
    try {
      const response = await fetch(`/api/vendors/${slug}/follow`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setVendor(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isFollowing: data.data.isFollowing,
            followerCount: data.data.followerCount,
          };
        });
        toast.success(data.data.isFollowing ? "Shop followed!" : "Shop unfollowed");
      } else {
        toast.error(data.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleShopAllItems = () => {
    router.push(`/vendors/${slug}`);
  };

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";

  // Fetch vendor details
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/vendors/${slug}`);
        const data = await response.json();

        if (data.success) {
          setVendor(data.data.vendor);
        } else {
          toast.error("Vendor not found");
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
        toast.error("Failed to load vendor");
      }
    };

    fetchVendor();
  }, [slug]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.categories)) {
          const cats = data.data.categories;
          const treeCategories = cats.filter((c: any) => !c.parentId).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            children: c.children || []
          }));
          setAllCategories(treeCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch vendor products
  useEffect(() => {
    if (!vendor) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          vendorId: vendor.id,
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sortBy && { sortBy }),
          ...(inStock && { inStock: "true" }),
        });

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendor, page, search, categoryId, minPrice, maxPrice, sortBy, inStock]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/vendors/${slug}?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    updateURL({ search: query });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateURL({ [key]: value });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!vendor && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      {vendor && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{vendor.businessName}</span>
        </nav>
      )}

      {/* Vendor Header - Immersive Design */}
      {vendor && (
        <div className="mb-12">
          <Card className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-950">
            {/* Banner */}
            <div className="relative h-64 sm:h-80 bg-slate-100 dark:bg-slate-900 overflow-hidden">
              {vendor.banner ? (
                <Image
                  src={vendor.banner}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                  <Store className="h-16 w-16 text-muted-foreground/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Vendor Profle Section */}
            <div className="px-8 pb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20 relative z-10 text-center sm:text-left">
                {/* Logo with Ring */}
                <div className="h-32 w-32 sm:h-44 sm:w-44 rounded-[2rem] border-8 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative flex-shrink-0">
                  {vendor.logo ? (
                    <Image src={vendor.logo} alt={vendor.businessName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/10">
                      <Store className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="pb-2 space-y-3 flex-1">
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-2">
                      {vendor.businessName}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Badge className="bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] h-7 px-3 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Official Store
                      </Badge>
                      <Badge variant="outline" className="border-2 font-black uppercase tracking-widest text-[10px] h-7 px-3">
                        {vendor.productCount} CURATED ITEMS
                      </Badge>
                      {vendor.serviceCount && vendor.serviceCount > 0 ? (
                        <Badge
                          variant="outline"
                          onClick={() => setActiveMainTab("services")}
                          className="border-2 border-orange-500/40 bg-orange-50/60 dark:bg-orange-950/20 text-[#FF6600] font-black uppercase tracking-widest text-[10px] h-7 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
                        >
                          <Briefcase className="h-3.5 w-3.5" />
                          {vendor.serviceCount} SERVICES OFFERED
                        </Badge>
                      ) : null}
                      {!vendor.shopOpen && (
                        <Badge variant="destructive" className="font-black uppercase tracking-widest text-[10px] h-7 px-3">
                          Temporarily Closed
                        </Badge>
                      )}
                    </div>

                    {/* Stats bar: Followers | Sold | Rating */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-600 dark:text-slate-300 text-sm font-semibold mt-3">
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{vendor.followerCount || 0}</strong> Followers
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{formatSells(vendor.totalSells || 0)}</strong> Sold
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-extrabold text-base">{(vendor.rating || 0).toFixed(1)}</strong>
                        <Star className="w-4.5 h-4.5 fill-yellow-500 text-yellow-500 inline" />
                      </span>
                    </div>

                    {/* Buttons: Follow, Shop items, and View Services */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followingLoading}
                        className={`h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 border-2 ${
                          vendor.isFollowing
                            ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                            : "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white hover:bg-slate-800 dark:hover:bg-slate-100"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        {vendor.isFollowing ? "Following" : "Follow"}
                      </button>

                      <button
                        onClick={() => {
                          setActiveMainTab("products");
                          handleShopAllItems();
                        }}
                        className={`h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all border-2 ${
                          activeMainTab === "products"
                            ? "bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-sm"
                            : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        Shop all items ({vendor.productCount})
                      </button>

                      {vendor.serviceCount && vendor.serviceCount > 0 ? (
                        <button
                          onClick={() => {
                            setActiveMainTab("services");
                            const section = document.getElementById("store-offerings-section");
                            if (section) section.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 border-2 ${
                            activeMainTab === "services"
                              ? "bg-[#FF6600] text-white border-[#FF6600] shadow-md shadow-orange-500/20"
                              : "border-orange-500/60 text-[#FF6600] hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          }`}
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>View Services ({vendor.serviceCount})</span>
                        </button>
                      ) : null}

                      {vendor.customDomain && (
                        <a
                          href={`https://${vendor.customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visit Official Store ({vendor.customDomain})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {vendor.description && (
                    <p className="max-w-2xl text-muted-foreground font-medium italic text-lg leading-relaxed pt-2">
                      "{vendor.description}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Store Navigation Tabs (Products vs Services) */}
      {vendor && vendor.serviceCount && vendor.serviceCount > 0 ? (
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 mb-8" id="store-offerings-section">
          <button
            type="button"
            onClick={() => setActiveMainTab("products")}
            className={`flex items-center gap-2 pb-3.5 px-5 text-sm font-black border-b-2 transition-all ${
              activeMainTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({vendor.productCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("services")}
            className={`flex items-center gap-2 pb-3.5 px-5 text-sm font-black border-b-2 transition-all ${
              activeMainTab === "services"
                ? "border-[#FF6600] text-[#FF6600]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Services &amp; Appointments ({vendor.serviceCount})</span>
            <Badge className="bg-[#FF6600] text-white text-[10px] px-2 py-0 h-4 rounded-full">
              {vendor.serviceCount}
            </Badge>
          </button>
        </div>
      ) : null}

      {/* Main Tab Content: Services or Products */}
      {activeMainTab === "services" ? (
        /* ================= VENDOR SERVICES VIEW ================= */
        <div className="space-y-6">
          {/* Services Header & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-orange-100 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#FF6600]/10 dark:bg-[#FF6600]/20 text-[#FF6600] rounded-xl">
                  <Briefcase className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Services by {vendor?.businessName}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Book professional services, repairs, consultations, and bespoke bookings directly from this store.
              </p>
            </div>

            {/* Quick search in vendor services */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
              />
            </div>
          </div>

          {/* Services List Grid */}
          {(() => {
            const filteredServices = (vendor?.services || []).filter((s: any) => {
              if (!serviceSearch.trim()) return true;
              const q = serviceSearch.toLowerCase().trim();
              return (
                s.name?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q) ||
                s.shortDesc?.toLowerCase().includes(q) ||
                s.category?.name?.toLowerCase().includes(q) ||
                s.subCategory?.name?.toLowerCase().includes(q) ||
                s.district?.toLowerCase().includes(q) ||
                s.city?.toLowerCase().includes(q)
              );
            });

            if (filteredServices.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border p-12 text-center max-w-md mx-auto my-8">
                  <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-bold text-foreground">No services found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {serviceSearch ? "No services match your search query." : "This store does not currently offer services."}
                  </p>
                  {serviceSearch && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setServiceSearch("")}
                      className="mt-4 text-xs"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((svc: any) => {
                  const primaryImage = svc.images?.[0] || svc.category?.image || null;

                  return (
                    <div
                      key={svc.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                    >
                      {/* Image */}
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

                        {/* Category Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                            {svc.subCategory?.name || svc.category?.name || "Service"}
                          </span>
                        </div>

                        {/* Duration */}
                        {svc.duration && (
                          <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#FF6600]" />
                            {svc.duration}
                          </div>
                        )}

                        {/* Location */}
                        {(svc.city || svc.district) && (
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 max-w-[140px]">
                            <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                            <span className="truncate">
                              {[svc.city, svc.district].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Delivery Mode */}
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
                            ) : (
                              <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" /> Store &amp; Home
                              </span>
                            )}
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <Link
                            href={`/services/${svc.slug || svc.id}`}
                            className="font-bold text-sm text-foreground hover:text-[#FF6600] line-clamp-2 transition-colors leading-snug"
                          >
                            {svc.name}
                          </Link>
                          {svc.shortDesc && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {svc.shortDesc}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Rate</span>
                            <span className="font-black text-sm text-[#FF6600]">
                              {formatPrice(svc)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleWhatsAppInquiry(svc)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              Inquire / Book
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="rounded-xl text-xs font-bold h-9 px-3 border-slate-200 dark:border-slate-800"
                            >
                              <Link href={`/services/${svc.slug || svc.id}`}>
                                Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ================= VENDOR PRODUCTS VIEW (Default) ================= */
        <>
          {/* Subtle Services Available Notice if store offers services */}
          {vendor?.serviceCount && vendor.serviceCount > 0 ? (
            <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="p-1.5 bg-[#FF6600]/10 text-[#FF6600] rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span>
                  Looking for services? <strong>{vendor.businessName}</strong> also offers <strong>{vendor.serviceCount} professional service(s)</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMainTab("services")}
                className="text-xs font-bold text-[#FF6600] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Explore Services</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Search Bar */}
          <div className="mb-6" id="vendor-products-section">
            <SearchBar
              onSearch={handleSearch}
              defaultValue={search}
              placeholder={`Search in ${vendor?.businessName || "store"}...`}
            />
          </div>

          {/* Filters and Count Bar - Clean Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-y mb-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-[64px] z-10 px-4 -mx-4 sm:mx-0">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <span className="text-primary font-black">{pagination.total}</span>
                )} Products Found
              </div>
            </div>
            <div className="flex items-center gap-6">
              <ProductSort
                value={sortBy}
                onValueChange={(val) => updateURL({ sortBy: val })}
              />
              <div className="flex items-center gap-2">
                <span className="text-[#333] font-semibold uppercase text-xs tracking-widest hidden sm:inline-block">View As</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setViewAs(1)} className={`p-1 flex border transition-colors ${viewAs === 1 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-4 h-4 ${viewAs === 1 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
                  <button onClick={() => setViewAs(2)} className={`p-1 flex gap-[2px] border transition-colors ${viewAs === 2 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-2 h-4 ${viewAs === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-2 h-4 ${viewAs === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
                  <button onClick={() => setViewAs(3)} className={`p-1 hidden sm:flex gap-[2px] border transition-colors ${viewAs === 3 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-1 h-4 ${viewAs === 3 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
                  <button onClick={() => setViewAs(4)} className={`p-1 hidden md:flex gap-[2px] border transition-colors ${viewAs === 4 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[3px] h-4 ${viewAs === 4 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
                  <button onClick={() => setViewAs(5)} className={`p-1 hidden lg:flex gap-[2px] border transition-colors ${viewAs === 5 ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div><div className={`w-[2px] h-4 ${viewAs === 5 ? 'bg-primary' : 'bg-gray-300'}`}></div></button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="w-full lg:w-[280px] shrink-0">
              <SidebarFilters basePath={`/vendors/${slug}`} categories={allCategories} vendors={[]} activeCategoryId={categoryId} />
            </aside>

            {/* Content Area */}
            <div className="flex-1">
              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <ProductGrid products={products} columns={viewAs} />
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="mt-16 py-8 border-t">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {vendor && (
        <StoreAiAssistant
          contextType="VENDOR"
          contextId={slug}
          storeName={vendor.businessName}
        />
      )}
    </div>
  );
}

export default function VendorStorePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading vendor store...</p>
      </div>
    }>
      <VendorStorePageContent />
    </Suspense>
  );
}
