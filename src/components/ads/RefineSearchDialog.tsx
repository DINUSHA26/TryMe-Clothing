"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, MapPin, Tag, ListFilter, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FieldDefinition {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  options: any;
  isRequired: boolean;
  isOptional: boolean;
  placeholder: string | null;
  helpText: string | null;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  fieldDefinitions: FieldDefinition[];
  _count?: {
    ads: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  subCategories: SubCategory[];
}

interface RefineSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryData: Category | undefined;
  selectedSubCategoryData: SubCategory | undefined;
  currentDistrict: string;
  currentLocalArea: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentSort: string;
  currentSearch: string;
  activeSpecs: Record<string, string>;
  onOpenLocation: () => void;
  onOpenCategory: () => void;
  onApply: (filters: Record<string, any>) => void;
}

const PRICE_PRESETS = [
  { label: "Below 25K", min: "", max: "25000" },
  { label: "25K - 50K", min: "25000", max: "50000" },
  { label: "50K - 150K", min: "50000", max: "150000" },
  { label: "150K - 300K", min: "150000", max: "300000" },
  { label: "Over 300K", min: "300000", max: "" },
];

export function RefineSearchDialog({
  isOpen,
  onClose,
  categories,
  selectedCategoryData,
  selectedSubCategoryData,
  currentDistrict,
  currentLocalArea,
  currentMinPrice,
  currentMaxPrice,
  currentSort,
  currentSearch,
  activeSpecs,
  onOpenLocation,
  onOpenCategory,
  onApply,
}: RefineSearchDialogProps) {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    location: true,
    category: true,
    price: true,
    posterType: false,
    promotedListings: false,
    sortBy: true,
  });

  // Local temporary states for filtering
  const [tempMinPrice, setTempMinPrice] = useState(currentMinPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(currentMaxPrice);
  const [tempSort, setTempSort] = useState(currentSort);
  const [tempPosterType, setTempPosterType] = useState<string>("all");
  const [tempUrgent, setTempUrgent] = useState<boolean>(false);
  const [tempSpecs, setTempSpecs] = useState<Record<string, string>>({});

  // Dynamic posts count
  const [postCount, setPostCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState<boolean>(false);

  // Sync internal states when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempMinPrice(currentMinPrice);
      setTempMaxPrice(currentMaxPrice);
      setTempSort(currentSort);
      setTempSpecs({ ...activeSpecs });
    }
  }, [isOpen, currentMinPrice, currentMaxPrice, currentSort, activeSpecs]);

  // Expand category specs sections automatically when subcategory changes
  useEffect(() => {
    if (selectedSubCategoryData?.fieldDefinitions) {
      const newSections = { ...openSections };
      selectedSubCategoryData.fieldDefinitions.forEach((field) => {
        // Default expand the first few spec fields
        newSections[field.fieldKey] = true;
      });
      setOpenSections(newSections);
    }
  }, [selectedSubCategoryData]);

  // Fetch count of matching posts dynamically as filters change
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchCount = async () => {
      setLoadingCount(true);
      try {
        const queryParams = new URLSearchParams({
          pageSize: "1",
          sort: tempSort,
        });

        if (currentDistrict && currentDistrict !== "All of Sri Lanka") {
          queryParams.append("district", currentDistrict);
        }
        if (currentLocalArea) {
          queryParams.append("localArea", currentLocalArea);
        }
        if (selectedCategoryData) {
          queryParams.append("category", selectedCategoryData.slug);
        }
        if (selectedSubCategoryData) {
          queryParams.append("subCategory", selectedSubCategoryData.slug);
        }
        if (currentSearch) {
          queryParams.append("search", currentSearch);
        }
        if (tempMinPrice) {
          queryParams.append("minPrice", tempMinPrice);
        }
        if (tempMaxPrice) {
          queryParams.append("maxPrice", tempMaxPrice);
        }

        // Add local specifications
        Object.entries(tempSpecs).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });

        const res = await fetch(`/api/ads/public?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && active) {
          setPostCount(data.data.pagination.totalCount);
        }
      } catch (err) {
        console.error("Error fetching refined post count:", err);
      } finally {
        if (active) setLoadingCount(false);
      }
    };

    const timer = setTimeout(fetchCount, 250); // debounce API requests
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    currentDistrict,
    currentLocalArea,
    selectedCategoryData,
    selectedSubCategoryData,
    currentSearch,
    tempMinPrice,
    tempMaxPrice,
    tempSort,
    tempSpecs,
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePresetPrice = (min: string, max: string) => {
    setTempMinPrice(min);
    setTempMaxPrice(max);
  };

  const handleSpecCheckbox = (fieldKey: string, option: string, checked: boolean) => {
    setTempSpecs((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[fieldKey] = option;
      } else {
        delete updated[fieldKey];
      }
      return updated;
    });
  };

  const handleResetAll = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempSort("newest");
    setTempPosterType("all");
    setTempUrgent(false);
    setTempSpecs({});
    // Reset parent page category/location too if needed by applying cleared parameters
    onApply({
      district: "All of Sri Lanka",
      localArea: null,
      category: "",
      subCategory: null,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
      // Clear specs
      ...Object.keys(activeSpecs).reduce((acc, key) => ({ ...acc, [key]: null }), {}),
    });
    onClose();
  };

  const handleApply = () => {
    // Collect all parameters to apply
    const filters: Record<string, any> = {
      minPrice: tempMinPrice || null,
      maxPrice: tempMaxPrice || null,
      sort: tempSort,
      page: 1,
    };

    // First, clear old specifications from URL
    Object.keys(activeSpecs).forEach((key) => {
      filters[key] = null;
    });

    // Set updated specifications
    Object.entries(tempSpecs).forEach(([key, value]) => {
      filters[key] = value;
    });

    onApply(filters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-[95vw] h-[85vh] md:h-[680px] p-0 overflow-hidden flex flex-col rounded-2xl border border-gray-100 shadow-2xl bg-white">
        
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-gray-100 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-[#FF6600]" />
              <span>Refine Search</span>
            </DialogTitle>
            <DialogDescription className="hidden">Refine search criteria</DialogDescription>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DialogHeader>

        {/* Scrollable Filters */}
        <ScrollArea className="flex-grow">
          <div className="p-5 space-y-4 divide-y divide-gray-100">

            {/* 1. Location Section */}
            <div className="pt-4 first:pt-0 space-y-3">
              <button
                onClick={() => toggleSection("location")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Location</span>
                {openSections.location ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.location && (
                <div className="pl-1 pt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      {currentLocalArea ? `${currentLocalArea}, ${currentDistrict}` : currentDistrict}
                    </span>
                  </div>
                  <button
                    onClick={onOpenLocation}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Select Location
                  </button>
                </div>
              )}
            </div>

            {/* 2. Category Section */}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => toggleSection("category")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Category</span>
                {openSections.category ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.category && (
                <div className="pl-1 pt-1 space-y-2.5">
                  {selectedCategoryData ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs text-[#FF6600] font-bold">
                        <span>{selectedSubCategoryData?.name || selectedCategoryData.name}</span>
                        <button
                          onClick={() => {
                            onApply({ category: "", subCategory: null });
                          }}
                          className="hover:bg-orange-100 p-0.5 rounded-full"
                          aria-label="Clear category"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={onOpenCategory}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        Change category
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onOpenCategory}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Select Category
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Condition Section (Only if dynamic specification is not rendering condition) */}
            {selectedSubCategoryData && !selectedSubCategoryData.fieldDefinitions?.some(fd => fd.fieldKey === "condition") && (
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => toggleSection("condition")}
                  className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
                >
                  <span>Condition</span>
                  {openSections.condition ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>

                {openSections.condition && (
                  <div className="pl-1 pt-1 flex flex-wrap gap-4">
                    {["Used", "Brand New", "Refurbished"].map((cond) => {
                      const isChecked = tempSpecs["condition"] === cond;
                      return (
                        <label key={cond} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSpecCheckbox("condition", cond, e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                          />
                          <span className="text-xs font-medium text-gray-700">{cond}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Price Section */}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => toggleSection("price")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Price</span>
                {openSections.price ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.price && (
                <div className="pl-1 pt-1 space-y-3">
                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_PRESETS.map((preset) => {
                      const isActive = tempMinPrice === preset.min && tempMaxPrice === preset.max;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handlePresetPrice(preset.min, preset.max)}
                          className={cn(
                            "px-3 py-1 rounded-full border text-[11px] font-semibold transition-all",
                            isActive
                              ? "border-teal-600 bg-teal-50/50 text-teal-700 font-bold"
                              : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Min Price (Rs.)</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={tempMinPrice}
                        onChange={(e) => setTempMinPrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                    <span className="text-gray-300 self-end mb-2.5">—</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Max Price (Rs.)</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={tempMaxPrice}
                        onChange={(e) => setTempMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                    {(tempMinPrice || tempMaxPrice) && (
                      <button
                        onClick={() => { setTempMinPrice(""); setTempMaxPrice(""); }}
                        className="text-xs font-bold text-red-500 self-end mb-2.5 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Dynamic Category Specifications */}
            {selectedSubCategoryData?.fieldDefinitions && (selectedSubCategoryData.fieldDefinitions as FieldDefinition[]).map((field) => {
              let options: string[] = [];
              try {
                if (typeof field.options === "string") {
                  options = JSON.parse(field.options);
                } else if (Array.isArray(field.options)) {
                  options = field.options;
                }
              } catch (e) {
                console.error("Failed to parse options for field:", field.fieldKey, e);
              }

              if (options.length === 0) return null;

              const isSectionOpen = !!openSections[field.fieldKey];
              const selectedValue = tempSpecs[field.fieldKey] || "";

              return (
                <div key={field.id} className="pt-4 space-y-3">
                  <button
                    onClick={() => toggleSection(field.fieldKey)}
                    className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
                  >
                    <span>{field.label}</span>
                    {isSectionOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </button>

                  {isSectionOpen && (
                    <div className="pl-1 pt-1 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {options.map((opt) => {
                        const isChecked = selectedValue === opt;
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer select-none py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleSpecCheckbox(field.fieldKey, opt, e.target.checked)}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                            />
                            <span className="text-xs font-medium text-gray-700">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 6. Type of poster Section (For Ikman clone fidelity) */}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => toggleSection("posterType")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Type of poster</span>
                {openSections.posterType ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.posterType && (
                <div className="pl-1 pt-1 space-y-2">
                  {[
                    { label: "All posters", value: "all" },
                    { label: "Members", value: "members" },
                    { label: "Authorized Agent", value: "agent" },
                    { label: "Non-members", value: "nonmembers" },
                  ].map((poster) => (
                    <label key={poster.value} className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                      <input
                        type="radio"
                        name="posterType"
                        checked={tempPosterType === poster.value}
                        onChange={() => setTempPosterType(poster.value)}
                        className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span className="text-xs font-medium text-gray-700">{poster.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Promoted Listings Section (For Ikman clone fidelity) */}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => toggleSection("promotedListings")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Promoted Listings</span>
                {openSections.promotedListings ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.promotedListings && (
                <div className="pl-1 pt-1 py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={tempUrgent}
                      onChange={(e) => setTempUrgent(e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500 text-white tracking-wider">
                      URGENT
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* 8. Sort by Section */}
            <div className="pt-4 space-y-3">
              <button
                onClick={() => toggleSection("sortBy")}
                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
              >
                <span>Sort by</span>
                {openSections.sortBy ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {openSections.sortBy && (
                <div className="pl-1 pt-1 space-y-2">
                  {[
                    { label: "Date: Newest first", value: "newest" },
                    { label: "Date: Oldest first", value: "oldest" },
                    { label: "Price: Highest to Lowest", value: "price-desc" },
                    { label: "Price: Lowest to Highest", value: "price-asc" },
                  ].map((sortOption) => (
                    <label key={sortOption.value} className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={tempSort === sortOption.value}
                        onChange={() => setTempSort(sortOption.value)}
                        className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span className="text-xs font-medium text-gray-700">{sortOption.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <button
            onClick={handleResetAll}
            className="px-6 py-2 border border-teal-600 hover:bg-teal-50/50 text-teal-700 text-sm font-bold rounded-xl transition-all"
          >
            Reset all
          </button>
          <button
            onClick={handleApply}
            disabled={loadingCount}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {loadingCount && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            <span>Show {loadingCount ? "..." : postCount.toLocaleString()} posts</span>
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
