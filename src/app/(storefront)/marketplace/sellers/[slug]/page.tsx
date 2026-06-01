"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AdCard } from "@/components/ads/AdCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Store,
  Phone,
  Mail,
  Calendar,
  Grid,
  Info,
  MapPin,
  Globe,
  ArrowLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { formatDistance, format } from "date-fns";

export default function PublicSellerStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ads" | "about" | "contact" | "services">("ads");

  const fetchStorefrontData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ads/public/sellers/${params.slug}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load seller storefront",
        });
        return;
      }
      setData(result.data);
    } catch (error) {
      console.error("Error loading seller storefront:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading storefront details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.slug) {
      fetchStorefrontData();
    }
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading shop storefront...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
        <Button variant="ghost" onClick={() => router.push("/marketplace")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </Button>
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-sm">
          Storefront not found or has been suspended.
        </div>
      </div>
    );
  }

  const { seller, servicePages = [], ads = [] } = data;
  const contactInfo = seller.contactInfo || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header section with cover banner */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Banner Cover */}
        <div className="h-[140px] md:h-[220px] relative overflow-hidden bg-gray-100">
          {contactInfo.banner ? (
            <img src={contactInfo.banner} alt="Store Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#FF6600] to-indigo-950" />
          )}
        </div>

        {/* Profile info block */}
        <div className="p-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-10 md:-mt-16 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            {/* Logo box */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-[#FF6600] font-bold shrink-0">
              {contactInfo.logo ? (
                <img src={contactInfo.logo} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-10 h-10 md:w-14 md:h-14" />
              )}
            </div>
            <div className="space-y-1 pb-1">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {seller.businessName || `${seller.user?.firstName}'s Store`}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-xs text-gray-400 font-semibold pt-1">
                <span className="bg-orange-50 text-[#FF6600] px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]">
                  {seller.primaryCategory}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {format(new Date(seller.createdAt), "yyyy")}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl font-bold border-gray-200 hover:bg-orange-50 hover:text-[#FF6600]">
            <a href={`https://wa.me/${(contactInfo.whatsapp || contactInfo.phone || seller.phone).replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
              Contact Business
            </a>
          </Button>
        </div>

        {/* Tabs Bar */}
        <div className="border-t border-gray-50 flex overflow-x-auto select-none bg-gray-50/20 px-2">
          {[
            { id: "ads", label: `Ads (${ads.length})`, icon: Grid },
            { id: "about", label: "About Us", icon: Info },
            { id: "contact", label: "Contact Us", icon: MapPin },
            { id: "services", label: `Services (${servicePages.length})`, icon: FileText },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? "border-[#FF6600] text-[#FF6600] font-extrabold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid container based on active tab */}
      <div className="pt-2">
        {/* Ads tab */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900">Current Classified Listings</h2>
            {ads.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-2xl shadow-sm">
                No active listings from this seller at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.map((ad: any) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* About tab */}
        {activeTab === "about" && (
          <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <span>About Our Business</span>
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {seller.aboutContent || "No description provided by this business yet."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact tab */}
        {activeTab === "contact" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-black text-gray-900 border-b border-gray-50 pb-2">Contact Info</h2>
                <div className="space-y-3.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#FF6600] shrink-0" />
                    <span className="font-semibold text-gray-800">{contactInfo.phone || seller.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#FF6600] shrink-0" />
                    <span className="truncate text-gray-800">{seller.user?.email}</span>
                  </div>
                  {contactInfo.whatsapp && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#25D366] shrink-0" />
                        <span className="text-xs">WhatsApp: <strong className="text-gray-800">{contactInfo.whatsapp}</strong></span>
                      </div>
                      <Button asChild className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs py-2 shadow-sm">
                        <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                          Chat on WhatsApp
                        </a>
                      </Button>
                    </div>
                  )}
                  {contactInfo.facebook && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                      <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                      <a href={contactInfo.facebook} target="_blank" rel="noreferrer" className="text-[#FF6600] text-xs font-bold hover:underline truncate">Facebook Profile</a>
                    </div>
                  )}
                  {contactInfo.instagram && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-pink-600 shrink-0" />
                      <a href={contactInfo.instagram} target="_blank" rel="noreferrer" className="text-[#FF6600] text-xs font-bold hover:underline truncate">Instagram Feed</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-black text-gray-900 border-b border-gray-50 pb-2">Our Location</h2>
                {contactInfo.mapEmbedUrl ? (
                  <div className="w-full h-[250px] border border-gray-100 rounded-xl overflow-hidden">
                    <iframe
                      src={contactInfo.mapEmbedUrl}
                      className="w-full h-full border-none"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[250px] border border-dashed border-gray-200 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <MapPin className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-xs font-semibold">Storefront location map embed details are not configured.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services tab */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900">Custom Services Pages</h2>
            {servicePages.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-2xl shadow-sm">
                No custom services or additional pages published by this store.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servicePages.map((page: any) => (
                  <Card key={page.id} className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-6 space-y-3">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <FileText className="h-4.5 w-4.5 text-[#FF6600]" />
                        <span>{page.title}</span>
                      </h3>
                      <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed line-clamp-4">
                        {page.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
