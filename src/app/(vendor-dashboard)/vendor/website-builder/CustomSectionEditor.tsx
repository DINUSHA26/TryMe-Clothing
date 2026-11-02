"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sliders,
  Video,
  Layers,
  Camera,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  CloudUpload,
  Play,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/image";
import {
  CustomWebsiteSection,
  CustomSectionType,
  CustomSlideItem,
  CustomCarouselItem,
} from "@/types/website-builder";

interface Props {
  section: CustomWebsiteSection;
  index: number;
  total: number;
  onUpdate: (updated: CustomWebsiteSection) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export default function CustomSectionEditor({
  section,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleUpload = async (file: File, callback: (url: string) => void) => {
    try {
      toast.loading("Uploading image...", { id: "custom-sec-upload" });
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("folder", "website-builder/custom-sections");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        callback(data.data.url);
        toast.success("Image uploaded successfully!", { id: "custom-sec-upload" });
      } else {
        toast.error(data.error || "Upload failed", { id: "custom-sec-upload" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: "custom-sec-upload" });
    } finally {
      setUploadingField(null);
    }
  };

  // Section Type Badges & Themes
  const themeConfig = {
    slider: {
      label: "Banner Slider",
      icon: Sliders,
      badgeColor: "bg-indigo-600 text-white",
      borderActive:
        "border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-indigo-950/25 dark:to-slate-900 border-l-4 border-l-indigo-600",
      accentText: "text-indigo-600 dark:text-indigo-400",
    },
    video: {
      label: "Video Showcase",
      icon: Video,
      badgeColor: "bg-rose-600 text-white",
      borderActive:
        "border-rose-200/90 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/70 via-white to-white dark:from-rose-950/25 dark:to-slate-900 border-l-4 border-l-rose-600",
      accentText: "text-rose-600 dark:text-rose-400",
    },
    carousel: {
      label: "Feature Carousel",
      icon: Layers,
      badgeColor: "bg-amber-600 text-white",
      borderActive:
        "border-amber-200/90 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/25 dark:to-slate-900 border-l-4 border-l-amber-500",
      accentText: "text-amber-600 dark:text-amber-400",
    },
    image_banner: {
      label: "Image Banner",
      icon: Camera,
      badgeColor: "bg-teal-600 text-white",
      borderActive:
        "border-teal-200/90 dark:border-teal-900/60 bg-gradient-to-b from-teal-50/70 via-white to-white dark:from-teal-950/25 dark:to-slate-900 border-l-4 border-l-teal-600",
      accentText: "text-teal-600 dark:text-teal-400",
    },
  }[section.type] || {
    label: "Custom Section",
    icon: Sliders,
    badgeColor: "bg-slate-600 text-white",
    borderActive: "border-slate-200 bg-white border-l-4 border-l-slate-600",
    accentText: "text-slate-600",
  };

  const IconComponent = themeConfig.icon;

  // Slide Helpers
  const addSlide = () => {
    const currentSlides = section.slides || [];
    const newSlide: CustomSlideItem = {
      id: "slide-" + Date.now(),
      imageUrl: "",
      badgeText: "NEW",
      headline: "Promotional Headline",
      subheadline: "Short subtitle or offer details...",
      buttonText: "Learn More",
      buttonLink: "#products",
    };
    onUpdate({ ...section, slides: [...currentSlides, newSlide] });
  };

  const updateSlide = (idx: number, updates: Partial<CustomSlideItem>) => {
    const currentSlides = [...(section.slides || [])];
    currentSlides[idx] = { ...currentSlides[idx], ...updates };
    onUpdate({ ...section, slides: currentSlides });
  };

  const removeSlide = (idx: number) => {
    const currentSlides = [...(section.slides || [])];
    currentSlides.splice(idx, 1);
    onUpdate({ ...section, slides: currentSlides });
  };

  // Carousel Helpers
  const addCarouselItem = () => {
    const currentItems = section.carouselItems || [];
    const newItem: CustomCarouselItem = {
      id: "card-" + Date.now(),
      imageUrl: "",
      title: "Featured Card Title",
      badge: "HOT",
      price: "Rs. 2,500",
      description: "Brief highlight or feature description...",
      linkUrl: "#products",
    };
    onUpdate({ ...section, carouselItems: [...currentItems, newItem] });
  };

  const updateCarouselItem = (idx: number, updates: Partial<CustomCarouselItem>) => {
    const currentItems = [...(section.carouselItems || [])];
    currentItems[idx] = { ...currentItems[idx], ...updates };
    onUpdate({ ...section, carouselItems: currentItems });
  };

  const removeCarouselItem = (idx: number) => {
    const currentItems = [...(section.carouselItems || [])];
    currentItems.splice(idx, 1);
    onUpdate({ ...section, carouselItems: currentItems });
  };

  return (
    <div
      className={`border rounded-2xl transition-all shadow-sm ${
        section.enabled !== false
          ? themeConfig.borderActive
          : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 transition-transform"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${themeConfig.badgeColor}`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                {section.title || themeConfig.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${themeConfig.badgeColor}`}>
                {themeConfig.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Order: #{index + 1} of {total}
            </p>
          </div>
        </div>

        {/* Actions (Shift Up/Down, Toggle, Delete) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onMoveUp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              title="Move Up"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}

          {onMoveDown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              title="Move Down"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <Switch
            checked={section.enabled !== false}
            onCheckedChange={(val) => onUpdate({ ...section, enabled: val })}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete Section"
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Editor Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 space-y-5 bg-white/60 dark:bg-slate-900/40 rounded-b-2xl">
          {/* Section Heading Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Section Title / Admin Label
              </Label>
              <Input
                value={section.title || ""}
                onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                placeholder={`e.g. ${themeConfig.label}`}
                className="mt-1 rounded-xl text-xs font-semibold"
              />
            </div>
            {section.type !== "slider" && (
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Section Subtitle (Optional)
                </Label>
                <Input
                  value={section.subtitle || ""}
                  onChange={(e) => onUpdate({ ...section, subtitle: e.target.value })}
                  placeholder="e.g. Discover our featured seasonal specials"
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* ────────────────── 1. SLIDER SETTINGS ────────────────── */}
          {section.type === "slider" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-3">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Slides ({(section.slides || []).length})
                  </h5>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Label className="text-xs font-semibold">Autoplay Slides</Label>
                    <Switch
                      checked={section.autoplay !== false}
                      onCheckedChange={(val) => onUpdate({ ...section, autoplay: val })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSlide}
                  className="h-7 text-xs font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Slide
                </Button>
              </div>

              {(section.slides || []).map((slide, sIdx) => (
                <div
                  key={slide.id || sIdx}
                  className="p-3.5 rounded-xl border bg-white dark:bg-slate-800 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Slide #{sIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlide(sIdx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Slide Image */}
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Slide Photo</Label>
                    <div className="flex items-center gap-3 mt-1.5">
                      {slide.imageUrl && (
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden border bg-slate-100">
                          <Image src={slide.imageUrl} alt="Slide" fill className="object-cover" />
                        </div>
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs">
                        <CloudUpload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(f, (url) => updateSlide(sIdx, { imageUrl: url }));
                          }}
                        />
                      </label>
                      <Input
                        value={slide.imageUrl || ""}
                        onChange={(e) => updateSlide(sIdx, { imageUrl: e.target.value })}
                        placeholder="or paste image URL..."
                        className="text-xs rounded-xl h-8 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Badge Text (Optional)</Label>
                      <Input
                        value={slide.badgeText || ""}
                        onChange={(e) => updateSlide(sIdx, { badgeText: e.target.value })}
                        placeholder="e.g. NEW ARRIVAL"
                        className="text-xs rounded-lg h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Headline</Label>
                      <Input
                        value={slide.headline || ""}
                        onChange={(e) => updateSlide(sIdx, { headline: e.target.value })}
                        placeholder="Slide Main Headline"
                        className="text-xs rounded-lg h-8 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Subheadline / Description</Label>
                    <Input
                      value={slide.subheadline || ""}
                      onChange={(e) => updateSlide(sIdx, { subheadline: e.target.value })}
                      placeholder="Short details or promotion info..."
                      className="text-xs rounded-lg h-8"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Button Text</Label>
                      <Input
                        value={slide.buttonText || ""}
                        onChange={(e) => updateSlide(sIdx, { buttonText: e.target.value })}
                        placeholder="e.g. Shop Now"
                        className="text-xs rounded-lg h-8 font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Button Link</Label>
                      <Input
                        value={slide.buttonLink || ""}
                        onChange={(e) => updateSlide(sIdx, { buttonLink: e.target.value })}
                        placeholder="e.g. #products or /pages/sale"
                        className="text-xs rounded-lg h-8 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ────────────────── 2. VIDEO SETTINGS ────────────────── */}
          {section.type === "video" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Video URL (YouTube, Vimeo, or MP4) *
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <Input
                    value={section.videoUrl || ""}
                    onChange={(e) => onUpdate({ ...section, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    className="rounded-xl text-xs font-mono font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports YouTube standard videos, Shorts, Vimeo, or direct .mp4 video links.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Video Heading Title
                  </Label>
                  <Input
                    value={section.videoTitle || ""}
                    onChange={(e) => onUpdate({ ...section, videoTitle: e.target.value })}
                    placeholder="e.g. See Our Process in Action"
                    className="mt-1 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Aspect Ratio
                  </Label>
                  <select
                    value={section.aspectRatio || "16:9"}
                    onChange={(e) => onUpdate({ ...section, aspectRatio: e.target.value as any })}
                    className="mt-1 w-full h-9 px-3 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="16:9">16:9 (Standard Widescreen)</option>
                    <option value="4:3">4:3 (Classic Video)</option>
                    <option value="1:1">1:1 (Square Showcase)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Video Subtitle Description
                </Label>
                <Textarea
                  rows={2}
                  value={section.videoSubtitle || ""}
                  onChange={(e) => onUpdate({ ...section, videoSubtitle: e.target.value })}
                  placeholder="Short explanatory text shown above the video..."
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    CTA Action Button Text (Optional)
                  </Label>
                  <Input
                    value={section.videoButtonText || ""}
                    onChange={(e) => onUpdate({ ...section, videoButtonText: e.target.value })}
                    placeholder="e.g. Order This Product"
                    className="mt-1 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    CTA Button Link
                  </Label>
                  <Input
                    value={section.videoButtonLink || ""}
                    onChange={(e) => onUpdate({ ...section, videoButtonLink: e.target.value })}
                    placeholder="e.g. #contact or #products"
                    className="mt-1 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 3. CAROUSEL SETTINGS ────────────────── */}
          {section.type === "carousel" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Carousel Cards ({(section.carouselItems || []).length})
                </h5>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCarouselItem}
                  className="h-7 text-xs font-bold rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Card
                </Button>
              </div>

              <div className="space-y-3">
                {(section.carouselItems || []).map((item, cIdx) => (
                  <div
                    key={item.id || cIdx}
                    className="p-3.5 rounded-xl border bg-white dark:bg-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Card #{cIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCarouselItem(cIdx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Photo */}
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Card Photo</Label>
                      <div className="flex items-center gap-3 mt-1.5">
                        {item.imageUrl && (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border bg-slate-100">
                            <Image src={item.imageUrl} alt="Card" fill className="object-cover" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs">
                          <CloudUpload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(f, (url) => updateCarouselItem(cIdx, { imageUrl: url }));
                            }}
                          />
                        </label>
                        <Input
                          value={item.imageUrl || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { imageUrl: e.target.value })}
                          placeholder="or paste image URL..."
                          className="text-xs rounded-xl h-8 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[11px] font-bold text-slate-600">Card Title *</Label>
                        <Input
                          value={item.title || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { title: e.target.value })}
                          placeholder="e.g. Silk Saree"
                          className="text-xs rounded-lg h-8 font-bold"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-slate-600">Badge Tag</Label>
                        <Input
                          value={item.badge || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { badge: e.target.value })}
                          placeholder="e.g. HOT DEAL"
                          className="text-xs rounded-lg h-8 uppercase font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-slate-600">Price / Label</Label>
                        <Input
                          value={item.price || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { price: e.target.value })}
                          placeholder="e.g. Rs. 3,500"
                          className="text-xs rounded-lg h-8 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-bold text-slate-600">Short Description</Label>
                        <Input
                          value={item.description || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { description: e.target.value })}
                          placeholder="e.g. Handcrafted from authentic Ceylon silk"
                          className="text-xs rounded-lg h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-slate-600">Target Link URL</Label>
                        <Input
                          value={item.linkUrl || ""}
                          onChange={(e) => updateCarouselItem(cIdx, { linkUrl: e.target.value })}
                          placeholder="e.g. #products or /pages/silk"
                          className="text-xs rounded-lg h-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────────────── 4. IMAGE BANNER SETTINGS ────────────────── */}
          {section.type === "image_banner" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Banner Image *
                </Label>
                <div className="flex items-center gap-3 mt-1.5">
                  {section.bannerImageUrl && (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border bg-slate-100">
                      <Image
                        src={section.bannerImageUrl}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs">
                    <CloudUpload className="w-4 h-4 text-teal-600" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f, (url) => onUpdate({ ...section, bannerImageUrl: url }));
                      }}
                    />
                  </label>
                  <Input
                    value={section.bannerImageUrl || ""}
                    onChange={(e) => onUpdate({ ...section, bannerImageUrl: e.target.value })}
                    placeholder="or paste image URL..."
                    className="text-xs rounded-xl h-9 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Banner Click Link URL (Optional)
                  </Label>
                  <Input
                    value={section.bannerLinkUrl || ""}
                    onChange={(e) => onUpdate({ ...section, bannerLinkUrl: e.target.value })}
                    placeholder="e.g. #products or /pages/sale"
                    className="mt-1 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Banner Display Height
                  </Label>
                  <select
                    value={section.bannerHeight || "medium"}
                    onChange={(e) => onUpdate({ ...section, bannerHeight: e.target.value as any })}
                    className="mt-1 w-full h-9 px-3 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="compact">Compact (240px)</option>
                    <option value="medium">Medium Standard (360px)</option>
                    <option value="tall">Tall Hero Banner (480px)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                  Optional Text Overlay on Banner
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Headline</Label>
                    <Input
                      value={section.bannerOverlayHeadline || ""}
                      onChange={(e) => onUpdate({ ...section, bannerOverlayHeadline: e.target.value })}
                      placeholder="e.g. Seasonal Clearance"
                      className="text-xs rounded-lg h-8 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Button Text</Label>
                    <Input
                      value={section.bannerOverlayBtnText || ""}
                      onChange={(e) => onUpdate({ ...section, bannerOverlayBtnText: e.target.value })}
                      placeholder="e.g. Claim 30% Off"
                      className="text-xs rounded-lg h-8 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-600">Subheadline Text</Label>
                  <Input
                    value={section.bannerOverlaySubheadline || ""}
                    onChange={(e) => onUpdate({ ...section, bannerOverlaySubheadline: e.target.value })}
                    placeholder="e.g. High quality items while stocks last"
                    className="text-xs rounded-lg h-8"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

