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
      {/* ROW 1: Main Service Categories (Circular Avatars) */}
      <div className="relative group/row1">
        <button
          onClick={() => scroll(row1Ref, "left")}
          type="button"
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-10 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row1:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

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
              className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
            >
              <div
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                  !selectedCategoryId || selectedCategoryId === "all"
                    ? "border-[#FF6600] ring-4 ring-[#FF6600]/20 bg-orange-50 text-[#FF6600]"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                )}
              >
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold text-center max-w-[80px] line-clamp-2",
                  !selectedCategoryId || selectedCategoryId === "all"
                    ? "text-[#FF6600]"
                    : "text-slate-700 dark:text-slate-300"
                )}
              >
                All Services
              </span>
            </button>

            {/* List of Main Service Categories */}
            {categories.map((cat) => {
              const isActive = activeMainCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                >
                  <div
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden transition-all duration-200 border-2 relative flex items-center justify-center bg-slate-100 dark:bg-slate-900",
                      isActive
                        ? "border-[#FF6600] ring-4 ring-[#FF6600]/20 shadow-md scale-105"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:scale-102"
                    )}
                  >
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    ) : (
                      <Briefcase
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8",
                          isActive ? "text-[#FF6600]" : "text-slate-400"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center max-w-[85px] line-clamp-2 transition-colors",
                      isActive
                        ? "text-[#FF6600] font-bold"
                        : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900"
                    )}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => scroll(row1Ref, "right")}
          type="button"
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-10 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition opacity-0 group-hover/row1:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ROW 2: Subcategories (when a main category is selected) */}
      {hasSubcategories && activeMainCategory && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 relative group/row2 animate-in fade-in duration-200">
          <div className="flex items-center justify-center mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {activeMainCategory.name} <span className="text-[#FF6600]">/ Subcategories</span>
            </span>
          </div>

          <div
            ref={row2Ref}
            className="overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-center gap-3 min-w-max mx-auto justify-start md:justify-center">
              {/* "All [Category Name]" pill */}
              <button
                type="button"
                onClick={() => onSelectCategory(activeMainCategory!.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  !activeSubCategoryId
                    ? "bg-[#FF6600] text-white border-[#FF6600] shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                )}
              >
                {!activeSubCategoryId && <Check className="w-3.5 h-3.5" />}
                All {activeMainCategory.name}
              </button>

              {/* Subcategory Pills */}
              {activeMainCategory.subCategories!.map((sub) => {
                const isSubActive = activeSubCategoryId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectCategory(sub.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      isSubActive
                        ? "bg-[#FF6600] text-white border-[#FF6600] font-semibold shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {sub.image ? (
                      <div className="w-4 h-4 rounded-full overflow-hidden relative shrink-0">
                        <Image src={sub.image} alt={sub.name} fill className="object-cover" />
                      </div>
                    ) : null}
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
