"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DynamicSpecsDisplay } from "@/components/ads/DynamicSpecsDisplay";
import { AdCard } from "@/components/ads/AdCard";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Tag,
  Clock,
  Eye,
  Phone,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { optimizeImageUrl } from "@/lib/imageLoader";

export default function PublicAdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [ad, setAd] = useState<any>(null);
  const [similarAds, setSimilarAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handlePrevious = () => {
    const list = ad?.images && ad.images.length > 0 ? ad.images : [""];
    if (list.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = () => {
    const list = ad?.images && ad.images.length > 0 ? ad.images : [""];
    if (list.length <= 1) return;
    setActiveImageIndex((prev) => (prev === list.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const getRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffDays = differenceInDays(now, date);
    
    if (diffDays === 0) {
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
      }
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  };

  const fetchAdDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ads/public/${params.adId}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load classified ad details",
        });
        return;
      }

      setAd(result.data);

      // Fetch similar ads in the same subcategory
      const subSlug = result.data.subCategory?.slug;
      if (subSlug) {
        const simResponse = await fetch(`/api/ads/public?subCategory=${subSlug}&pageSize=4`);
        const simResult = await simResponse.json();
        if (simResult.success) {
          // Exclude the current ad
          const filtered = simResult.data.ads.filter((item: any) => item.id !== result.data.id);
          setSimilarAds(filtered);
        }
      }
    } catch (error) {
      console.error("Error fetching ad details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.adId) {
      fetchAdDetails();
    }
  }, [params.adId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [params.adId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading ad details...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
        <Button variant="ghost" onClick={() => router.push("/marketplace")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </Button>
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-sm">
          Classified ad not found or has been removed.
        </div>
      </div>
    );
  }

  const imagesList = ad.images && ad.images.length > 0 ? ad.images : [""];
  const locationText = ad.localArea ? `${ad.localArea}, ${ad.district}` : ad.district;
  const contactInfo = (ad.seller?.contactInfo as any) || {};
  const sellerPhone = contactInfo.phone || ad.seller?.phone || "";
  const whatsappNumberRaw = contactInfo.whatsapp || sellerPhone || "";
  
  const formatWhatsAppNumber = (numStr: string) => {
    let clean = (numStr || "").replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
        clean = "94" + clean.substring(1);
    }
    return clean;
  };

  const whatsappNumber = formatWhatsAppNumber(whatsappNumberRaw);
  
  const adUrl = typeof window !== "undefined" ? window.location.href : "";
  const firstImage = imagesList[0] && imagesList[0] !== "" ? imagesList[0] : "";
  const shortDesc = ad.description ? (ad.description.length > 150 ? ad.description.substring(0, 150) + "..." : ad.description) : "";
  
  const whatsappMessage = `Hi, is your classified listing "*${ad.title}*" still available?

*Link:* ${adUrl}
${firstImage ? `*Image:* ${firstImage}\n` : ""}
*Description:*
${shortDesc}`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/marketplace" className="hover:underline">Marketplace</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/marketplace?category=${ad.category?.slug}`} className="hover:underline">
          {ad.category?.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-gray-600 truncate">{ad.subCategory?.name}</span>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Image previews, specs, description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-4 md:p-6 space-y-4">
            {/* Header info */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                {ad.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-semibold border-b border-gray-50 pb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationText}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getRelativeTime(ad.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {ad.views} views
                </span>
              </div>
            </div>

            {/* Gallery inspect previews */}
            <div className="space-y-3">
              <div 
                className="w-full h-[300px] md:h-[400px] bg-gray-50 border rounded-2xl overflow-hidden relative flex items-center justify-center touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {imagesList[activeImageIndex] ? (
                  <img
                    src={optimizeImageUrl(imagesList[activeImageIndex], 800)}
                    alt={`${ad.title} preview ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 font-bold text-sm">No Photo Available</span>
                )}
              </div>

              {imagesList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                  {imagesList.map((url: string, index: number) => (
                    <button
                      key={url}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-16 h-12 bg-gray-50 border-2 rounded-lg shrink-0 overflow-hidden relative transition-colors ${
                        activeImageIndex === index ? "border-[#FF6600]" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <img src={optimizeImageUrl(url, 150)} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price display */}
            <div className="pt-2">
              <div className="text-2xl md:text-3xl font-black text-[#FF6600] flex items-baseline gap-2">
                {ad.price ? (
                  <>
                    Rs. {Number(ad.price).toLocaleString("en-LK")}
                    {ad.priceNegotiable && (
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider pl-1 border-l border-gray-100 ml-2">Negotiable</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 font-bold text-lg">Contact for Price</span>
                )}
              </div>
            </div>
          </div>

          {/* Specifications Display Table */}
          {ad.subCategory?.fieldDefinitions && (
            <DynamicSpecsDisplay
              fieldDefinitions={ad.subCategory.fieldDefinitions}
              specifications={ad.specifications}
            />
          )}

          {/* Description Box */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {ad.description}
            </p>
          </div>
        </div>

        {/* Right Column: Seller Info & Safety Tips */}
        <div className="space-y-6">
          {/* Seller profile box */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-[#FF6600] overflow-hidden shrink-0">
                {contactInfo.logo ? (
                  <img src={optimizeImageUrl(contactInfo.logo, 100)} alt="Store Logo" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 leading-snug">
                  {ad.seller?.businessName || `${ad.seller?.user?.firstName || "Verified"} Store`}
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5 flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                  <span>Verified Ad Publisher</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Phone reveal button */}
              {showPhone ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-50 border border-orange-100 text-[#FF6600] rounded-xl font-bold text-base shadow-sm">
                  <Phone className="h-4.5 w-4.5" />
                  <span>{sellerPhone}</span>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPhone(true)}
                  className="w-full bg-black hover:bg-gray-900 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2"
                >
                  <Phone className="h-4.5 w-4.5" />
                  <span>Reveal Phone Number</span>
                </Button>
              )}

              {/* WhatsApp Message link */}
              {sellerPhone && (
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50/30 rounded-xl py-6 font-bold flex items-center justify-center gap-2 bg-white"
                >
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4.5 w-4.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </Button>
              )}

              {/* View Storefront */}
              {ad.seller?.slug && (
                <Button
                  variant="ghost"
                  asChild
                  className="w-full text-xs text-gray-500 hover:text-black font-semibold rounded-xl"
                >
                  <Link href={`/marketplace/sellers/${ad.seller.slug}`}>
                    View Seller's Public Shop
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Safety tips box */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-[#FF6600]" />
              <span>Safety Tips for Buyers</span>
            </h4>
            <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4 leading-relaxed font-medium">
              <li>Meet the seller at a secure, public location.</li>
              <li>Inspect the item carefully and verify its working condition before making payment.</li>
              <li>Avoid paying in advance under any circumstances (bank transfers, advance deposits).</li>
              <li>Beware of unrealistic, extremely cheap prices.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related/Similar Listings */}
      {similarAds.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Similar Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similarAds.map((simAd) => (
              <AdCard key={simAd.id} ad={simAd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
