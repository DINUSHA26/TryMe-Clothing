"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Briefcase, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceSubCatItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
}

export interface ServiceCatItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  subCategories?: ServiceSubCatItem[];
}

interface ServiceCategoryCircleHierarchyProps {
  categories: ServiceCatItem[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function ServiceCategoryCircleHierarchy({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className,
}: ServiceCategoryCircleHierarchyProps) {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  // Determine which main category is active:
  let activeMainCategory: ServiceCatItem | undefined = undefined;
  let activeSubCategoryId: string | undefined = undefined;

  if (selectedCategoryId && selectedCategoryId !== "all") {
    const directMatch = categories.find((c) => c.id === selectedCategoryId);
    if (directMatch) {
      activeMainCategory = directMatch;
    } else {
      for (const cat of categories) {
        const sub = cat.subCategories?.find((s) => s.id === selectedCategoryId);
        if (sub) {
          activeMainCategory = cat;
          activeSubCategoryId = sub.id;
          break;
        }
      }
    }
  }

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const hasSubcategories =
    activeMainCategory &&
    activeMainCategory.subCategories &&
    activeMainCategory.subCategories.length > 0;

  return (
    <div className={cn("w-full bg-white dark:bg-slate-950 border-b pb-4 mb-6", className)}>
      {/* ROW 1: Main Service Categories (Large Circles) */}
      <div className="relative group/row1">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll(row1Ref, "left")}
          type="button"
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-10 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row1:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={row1Ref}
          className="overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-start gap-4 sm:gap-6 min-w-max mx-auto justify-start md:justify-center">
            {/* "All Services" Circle */}
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className="group flex flex-col items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
            >
              <div
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-sm",
                  !selectedCategoryId || selectedCategoryId === "all"
                    ? "bg-[#FF6600] text-white border-[#FF6600] ring-4 ring-[#FF6600]/30 shadow-md scale-105"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:border-[#FF6600]/50"
                )}
              >
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm text-center line-clamp-2 max-w-[80px] sm:max-w-[96px] transition-colors leading-tight",
                  !selectedCategoryId || selectedCategoryId === "all"
                    ? "font-bold text-[#FF6600]"
                    : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#FF6600]"
                )}
              >
                All Services
              </span>
            </button>

            {/* Main Categories */}
            {categories.map((cat) => {
              const isMainActive = activeMainCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="group flex flex-col items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
                >
                  <div
                    className={cn(
                      "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-sm bg-slate-100 dark:bg-slate-800",
                      isMainActive
                        ? "border-[#FF6600] ring-4 ring-[#FF6600]/30 shadow-md scale-105"
                        : "border-slate-200 dark:border-slate-700 group-hover:border-[#FF6600]/50"
                    )}
                  >
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 80px, 96px"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Briefcase className="w-8 h-8" />
                      </div>
                    )}
                    {isMainActive && (
                      <div className="absolute inset-0 bg-[#FF6600]/10 pointer-events-none" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs sm:text-sm text-center line-clamp-2 max-w-[80px] sm:max-w-[96px] transition-colors leading-tight",
                      isMainActive
                        ? "font-bold text-[#FF6600]"
                        : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#FF6600]"
                    )}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll(row1Ref, "right")}
          type="button"
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-10 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row1:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ROW 2: Subcategories (Circular Avatars with Labels Underneath, Shop by Category Style) */}
      {hasSubcategories && activeMainCategory && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 relative group/row2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2 px-1 md:justify-center">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{activeMainCategory.name}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-[#FF6600]">Subcategories</span>
            </span>
          </div>

          {/* Scroll Left Button */}
          <button
            onClick={() => scroll(row2Ref, "left")}
            type="button"
            aria-label="Scroll subcategories left"
            className="hidden md:flex absolute -left-3 top-14 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row2:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Subcategories Container */}
          <div
            ref={row2Ref}
            className="overflow-x-auto scrollbar-none py-1.5 px-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-start gap-3 sm:gap-5 min-w-max mx-auto justify-start md:justify-center">
              {/* "All [Main Category]" Circle Option */}
              <button
                type="button"
                onClick={() => onSelectCategory(activeMainCategory!.id)}
                className="group flex flex-col items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
              >
                <div
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs",
                    !activeSubCategoryId
                      ? "bg-[#FF6600] text-white border-[#FF6600] ring-3 ring-[#FF6600]/30 shadow-sm scale-105"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:border-[#FF6600]/50"
                  )}
                >
                  {!activeSubCategoryId ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-[10px] sm:text-xs text-center line-clamp-2 max-w-[65px] sm:max-w-[76px] transition-colors leading-tight",
                    !activeSubCategoryId
                      ? "font-bold text-[#FF6600]"
                      : "font-medium text-slate-600 dark:text-slate-400 group-hover:text-[#FF6600]"
                  )}
                >
                  All {activeMainCategory.name}
                </span>
              </button>

              {/* Circular Subcategory items */}
              {activeMainCategory.subCategories!.map((sub) => {
                const isSubActive = activeSubCategoryId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectCategory(sub.id)}
                    className="group flex flex-col items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
                  >
                    <div
                      className={cn(
                        "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-xs bg-slate-100 dark:bg-slate-800",
                        isSubActive
                          ? "border-[#FF6600] ring-3 ring-[#FF6600]/30 shadow-sm scale-105"
                          : "border-slate-200 dark:border-slate-700 group-hover:border-[#FF6600]/50"
                      )}
                    >
                      {sub.image ? (
                        <Image
                          src={sub.image}
                          alt={sub.name}
                          fill
                          sizes="(max-width: 640px) 48px, 56px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Briefcase className="w-5 h-5" />
                        </div>
                      )}
                      {isSubActive && (
                        <div className="absolute inset-0 bg-[#FF6600]/10 pointer-events-none" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] sm:text-xs text-center line-clamp-2 max-w-[65px] sm:max-w-[76px] transition-colors leading-tight",
                        isSubActive
                          ? "font-bold text-[#FF6600]"
                          : "font-medium text-slate-600 dark:text-slate-400 group-hover:text-[#FF6600]"
                      )}
                    >
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scroll(row2Ref, "right")}
            type="button"
            aria-label="Scroll subcategories right"
            className="hidden md:flex absolute -right-3 top-14 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row2:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
