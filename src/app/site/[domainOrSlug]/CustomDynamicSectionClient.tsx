"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, ExternalLink, ArrowRight } from "lucide-react";
import { CustomWebsiteSection } from "@/types/website-builder";

interface Props {
  section: CustomWebsiteSection;
  primaryColor?: string;
  navigateTo?: (page: string) => void;
  handleInquiryViaWhatsApp?: (item?: any) => void;
}

export function getEmbedVideoUrl(url: string): { type: "youtube" | "vimeo" | "video"; embedUrl: string } | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube match (standard, short, embed, shorts)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  return {
    type: "video",
    embedUrl: trimmed,
  };
}

export default function CustomDynamicSectionClient({
  section,
  primaryColor = "#5c2336",
  navigateTo,
  handleInquiryViaWhatsApp,
}: Props) {
  if (!section || section.enabled === false) return null;

  const handleActionClick = (link?: string) => {
    if (!link) {
      if (handleInquiryViaWhatsApp) handleInquiryViaWhatsApp();
      return;
    }
    if (link.startsWith("#") || link.startsWith("/")) {
      if (navigateTo && link.startsWith("/")) {
        const cleanSlug = link.replace(/^\//, "").replace(/^pages\//, "");
        navigateTo(cleanSlug || "home");
        return;
      }
      if (link.startsWith("#")) {
        const elem = document.querySelector(link);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // 1. SLIDER SECTION
  if (section.type === "slider") {
    const slides = section.slides && section.slides.length > 0
      ? section.slides
      : [];

    return <SliderSectionRenderer
      section={section}
      slides={slides}
      primaryColor={primaryColor}
      onAction={handleActionClick}
    />;
  }

  // 2. VIDEO SECTION
  if (section.type === "video") {
    const videoData = section.videoUrl ? getEmbedVideoUrl(section.videoUrl) : null;
    const aspectClass =
      section.aspectRatio === "4:3"
        ? "aspect-[4/3]"
        : section.aspectRatio === "1:1"
        ? "aspect-square max-w-xl mx-auto"
        : "aspect-[16/9]";

    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900 text-white border-b overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {(section.videoTitle || section.videoSubtitle || section.title) && (
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span
                className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Featured Video
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {section.videoTitle || section.title || "Watch Our Showcase"}
              </h2>
              {(section.videoSubtitle || section.subtitle) && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {section.videoSubtitle || section.subtitle}
                </p>
              )}
            </div>
          )}

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
            {videoData ? (
              videoData.type === "youtube" || videoData.type === "vimeo" ? (
                <div className={`w-full ${aspectClass}`}>
                  <iframe
                    src={videoData.embedUrl}
                    title={section.videoTitle || "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className={`w-full ${aspectClass}`}>
                  <video
                    src={videoData.embedUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            ) : (
              <div className={`w-full ${aspectClass} flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950`}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white mb-3 shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <p className="font-bold text-sm text-white">No Video URL Configured</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Add a YouTube, Vimeo, or MP4 link in Website Builder to display your video.
                </p>
              </div>
            )}
          </div>

          {section.videoButtonText && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleActionClick(section.videoButtonLink)}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{section.videoButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // 3. CAROUSEL SECTION
  if (section.type === "carousel") {
    const items = section.carouselItems && section.carouselItems.length > 0
      ? section.carouselItems
      : [];

    return <CarouselSectionRenderer
      section={section}
      items={items}
      primaryColor={primaryColor}
      onAction={handleActionClick}
    />;
  }

  // 4. IMAGE BANNER SECTION
  if (section.type === "image_banner") {
    const heightMap: Record<string, string> = {
      compact: "min-h-[220px] sm:min-h-[280px]",
      medium: "min-h-[320px] sm:min-h-[420px]",
      tall: "min-h-[440px] sm:min-h-[560px]",
      auto: "min-h-[240px]",
    };
    const heightClass = heightMap[section.bannerHeight || "medium"] || heightMap.medium;

    return (
      <section className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onClick={() => section.bannerLinkUrl && handleActionClick(section.bannerLinkUrl)}
          className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border shadow-lg flex items-center justify-center transition-all ${
            section.bannerLinkUrl ? "cursor-pointer group hover:shadow-2xl" : ""
          }`}
          style={{ backgroundColor: "#1e293b" }}
        >
          {section.bannerImageUrl ? (
            <Image
              src={section.bannerImageUrl}
              alt={section.bannerAltText || section.title || "Banner"}
              fill
              className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
          )}

          {/* Dark / Tint Overlay for readable text */}
          {(section.bannerOverlayHeadline || section.bannerOverlaySubheadline || section.bannerOverlayBtnText) && (
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/85 via-black/55 to-black/30 flex items-center">
              <div className="p-6 sm:p-12 lg:p-16 max-w-2xl space-y-3.5 text-left text-white">
                {section.bannerOverlayHeadline && (
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight drop-shadow-md">
                    {section.bannerOverlayHeadline}
                  </h3>
                )}
                {section.bannerOverlaySubheadline && (
                  <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed drop-shadow-sm max-w-xl">
                    {section.bannerOverlaySubheadline}
                  </p>
                )}
                {section.bannerOverlayBtnText && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(section.bannerOverlayBtnLink || section.bannerLinkUrl);
                      }}
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>{section.bannerOverlayBtnText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────
// SLIDER SUB-COMPONENT
// ──────────────────────────────────────────────────────────────────
function SliderSectionRenderer({
  section,
  slides,
  primaryColor,
  onAction,
}: {
  section: CustomWebsiteSection;
  slides: any[];
  primaryColor: string;
  onAction: (link?: string) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = slides.length;

  useEffect(() => {
    if (total <= 1 || section.autoplay === false) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [total, section.autoplay]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % total);
  };

  if (total === 0) {
    return (
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400 bg-slate-50">
          <p className="font-bold text-sm">Slider Section</p>
          <p className="text-xs text-slate-500 mt-1">Please add slides in Website Builder to display this slider.</p>
        </div>
      </section>
    );
  }

  const slide = slides[currentIdx];

  return (
    <section className="relative overflow-hidden bg-slate-900 border-b">
      <div
        className="relative min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] flex items-center"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 50) handleNext();
          else if (diff < -50) handlePrev();
          touchStartX.current = null;
        }}
      >
        {/* Slide Background Image */}
        {slide.imageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={slide.imageUrl}
              alt={slide.headline || "Slide"}
              fill
              className="object-cover object-center transition-all duration-700"
              priority={currentIdx === 0}
              sizes="100vw"
            />
            {/* Gradient Overlay for high text readability */}
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        )}

        {/* Slide Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-2xl space-y-4 sm:space-y-6 text-white text-left">
            {slide.badgeText && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{slide.badgeText}</span>
              </div>
            )}

            {slide.headline && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                {slide.headline}
              </h2>
            )}

            {slide.subheadline && (
              <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed drop-shadow-sm max-w-xl">
                {slide.subheadline}
              </p>
            )}

            {slide.buttonText && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onAction(slide.buttonLink)}
                  className="inline-flex items-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-white font-black text-xs sm:text-sm shadow-2xl hover:opacity-95 transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{slide.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Left & Right Nav Arrows (visible when > 1 slide) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-3 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-3 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Dots Pagination */}
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIdx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// CAROUSEL SUB-COMPONENT
// ──────────────────────────────────────────────────────────────────
function CarouselSectionRenderer({
  section,
  items,
  primaryColor,
  onAction,
}: {
  section: CustomWebsiteSection;
  items: any[];
  primaryColor: string;
  onAction: (link?: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const scrollAmount = 320;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 border-b bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: primaryColor }}
            >
              FEATURED COLLECTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {section.title || "Explore Highlights"}
            </h2>
            {section.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                {section.subtitle}
              </p>
            )}
          </div>

          {items.length > 2 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400 bg-white">
            <p className="font-bold text-sm">Carousel Cards</p>
            <p className="text-xs text-slate-500 mt-1">Please add items in Website Builder to populate this carousel.</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => item.linkUrl && onAction(item.linkUrl)}
                className={`snap-start shrink-0 w-[260px] sm:w-[290px] rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                  item.linkUrl ? "cursor-pointer group" : ""
                }`}
              >
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Card"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs">
                      No Image
                    </div>
                  )}
                  {item.badge && (
                    <div
                      className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-black">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    {item.price ? (
                      <span className="font-black text-sm text-slate-900">
                        {item.price}
                      </span>
                    ) : (
                      <span />
                    )}

                    {item.linkUrl && (
                      <span
                        className="text-xs font-bold inline-flex items-center gap-1 group-hover:underline"
                        style={{ color: primaryColor }}
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

