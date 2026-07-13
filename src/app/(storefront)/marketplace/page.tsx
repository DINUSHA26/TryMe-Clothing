"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Grid, ChevronDown, ListFilter, RefreshCw, Star, Tag, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/ads/LocationPicker";
import { CategoryPicker } from "@/components/ads/CategoryPicker";
import { RefineSearchDialog } from "@/components/ads/RefineSearchDialog";
import { AdCard } from "@/components/ads/AdCard";
import { Button } from "@/components/ui/button";

function MarketplacePortalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Local component states
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [featuredAds, setFeaturedAds] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 2);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.6;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      const timer = setTimeout(checkScroll, 300);
      window.addEventListener("resize", checkScroll);
      return () => {
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
      };
    }
  }, [searchParams, categories]);

  // Active filters from query string
  const currentCategory = searchParams.get("category") || "";
  const currentSubCategory = searchParams.get("subCategory") || "";
  const currentDistrict = searchParams.get("district") || "All of Sri Lanka";
  const currentLocalArea = searchParams.get("localArea") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  // Temporary local state for price inputs
  const [tempMinPrice, setTempMinPrice] = useState(currentMinPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(currentMaxPrice);

  // Sync temp price states when URL changes
  useEffect(() => {
    setTempMinPrice(currentMinPrice);
    setTempMaxPrice(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  // Open dropdown state (e.g. "price" or fieldKey like "brand")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Compute active specification parameters
  const activeSpecs: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (![
      "search",
      "category",
      "subCategory",
      "district",
      "localArea",
      "isTopAd",
      "minPrice",
      "maxPrice",
      "sort",
      "page",
    ].includes(key)) {
      activeSpecs[key] = value;
    }
  });

  const hasActiveFilters =
    searchParams.has("category") ||
    searchParams.has("subCategory") ||
    currentSearch ||
    (currentDistrict && currentDistrict !== "All of Sri Lanka") ||
    currentMinPrice ||
    currentMaxPrice ||
    Object.keys(activeSpecs).length > 0;

  // Initialize search input from query
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Fetch Category Tree with count badges
  const fetchCategoryTree = async () => {
    const cached = localStorage.getItem("marketplace_categories_cache");
    if (cached) {
      try { setCategories(JSON.parse(cached)); } catch (e) {}
    }
    try {
      const response = await fetch("/api/ads/public/categories");
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
        localStorage.setItem("marketplace_categories_cache", JSON.stringify(result.data));
      }
    } catch (error) {
      console.error("Error loading categories tree:", error);
    }
  };

  // Fetch Listings matching filters
  const fetchListings = async () => {
    let hasCache = false;
    
    // Check cache for default landing view
    if (!hasActiveFilters && currentPage === 1) {
      const cached = localStorage.getItem("marketplace_feed_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setAds(parsed);
            setIsLoading(false);
            hasCache = true;
          }
        } catch (e) {}
      }
    }

    if (!hasCache) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: hasActiveFilters ? "10" : "12",
        sort: currentSort,
        ...(currentCategory && { category: currentCategory }),
        ...(currentSubCategory && { subCategory: currentSubCategory }),
        ...(currentDistrict && currentDistrict !== "All of Sri Lanka" && { district: currentDistrict }),
        ...(currentLocalArea && { localArea: currentLocalArea }),
        ...(currentSearch && { search: currentSearch }),
        ...(currentMinPrice && { minPrice: currentMinPrice }),
        ...(currentMaxPrice && { maxPrice: currentMaxPrice }),
      });

      // Append specification query parameters to the API request
      const standardKeys = [
        "search",
        "category",
        "subCategory",
        "district",
        "localArea",
        "isTopAd",
        "minPrice",
        "maxPrice",
        "sort",
        "page",
        "pageSize",
      ];
      searchParams.forEach((value, key) => {
        if (!standardKeys.includes(key)) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/ads/public?${params}`);
      const result = await response.json();

      if (result.success) {
        setAds(result.data.ads);
        setPagination(result.data.pagination);
        if (!hasActiveFilters && currentPage === 1) {
          localStorage.setItem("marketplace_feed_cache", JSON.stringify(result.data.ads));
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load listings",
        });
      }
    } catch (error) {
      console.error("Error loading listings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading classified listings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Featured/Top Ads for the landing view
  const fetchFeaturedAds = async () => {
    const cached = localStorage.getItem("marketplace_featured_cache");
    if (cached) {
      try { setFeaturedAds(JSON.parse(cached)); } catch (e) {}
    }
    try {
      const response = await fetch("/api/ads/public?isTopAd=true&pageSize=6");
      const result = await response.json();
      if (result.success) {
        setFeaturedAds(result.data.ads);
        localStorage.setItem("marketplace_featured_cache", JSON.stringify(result.data.ads));
      }
    } catch (err) {
      console.error("Error loading top ads:", err);
    }
  };

  useEffect(() => {
    fetchCategoryTree();
    fetchFeaturedAds();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string | number | null>) => {
    const urlParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        urlParams.delete(key);
      } else if (value === "" && key !== "category") {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value.toString());
      }
    });
    router.push(`/marketplace?${urlParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput, page: 1 });
  };

  const handleLocationSelect = (district: string, area: string) => {
    updateFilters({ district, localArea: area, page: 1 });
  };

  const handleCategorySelect = (
    catId: string,
    subId: string,
    catName: string,
    subName: string
  ) => {
    if (!catId) {
      // Clear category and subcategory filters
      updateFilters({
        category: "",
        subCategory: null,
        page: 1
      });
      return;
    }
    const parentCat = categories.find((c) => c.id === catId);
    if (parentCat) {
      const subCat = parentCat.subCategories?.find((s: any) => s.id === subId);
      updateFilters({
        category: parentCat.slug,
        subCategory: subCat ? subCat.slug : null,
        page: 1
      });
    }
  };

  const getCategoryCount = (category: any) => {
    return category.subCategories.reduce((sum: number, sub: any) => sum + (sub._count?.ads || 0), 0);
  };

  const selectedCategoryData = categories.find((c) => c.slug === currentCategory);
  const selectedSubCategoryData = selectedCategoryData?.subCategories?.find((s: any) => s.slug === currentSubCategory);

  return (
    <div className="space-y-0 min-h-screen bg-gray-50/50 pb-12">
      {/* TryMe orange header section - Landing View Only */}
      {!hasActiveFilters && (
        <div className="bg-[#FF6600] text-white py-8 px-4 border-b border-orange-700/10">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
              {/* Location Select trigger */}
              <button
                onClick={() => setIsLocationOpen(true)}
                className="bg-black/20 hover:bg-black/35 px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>{currentLocalArea || currentDistrict}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search box */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-5 pr-12 py-3.5 text-gray-900 bg-white rounded-full border-none shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#ffc800] hover:bg-[#e6b400] text-gray-950 p-2.5 rounded-full shadow-sm transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ikman.lk style Category Header - Filtered Search View Only */}
      {hasActiveFilters && (
        <>
          {/* Non-sticky breadcrumbs, title and search box */}
          <div className="bg-white px-4 pt-5 pb-3">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {currentSearch 
                      ? `Search results for "${currentSearch}"`
                      : `New and Used ${selectedCategoryData?.name || ""} for Sale in ${currentLocalArea || currentDistrict}`
                    }
                  </h1>
                  {/* Breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-400 mt-1 font-medium">
                    <span className="hover:underline hover:text-gray-900 cursor-pointer" onClick={() => router.push("/marketplace")}>Home</span>
                    <span>&gt;</span>
                    <span className="hover:underline hover:text-gray-900 cursor-pointer" onClick={() => router.push("/marketplace?category=")}>All ads</span>
                    {selectedCategoryData && (
                      <>
                        <span>&gt;</span>
                        <span className="hover:underline hover:text-gray-900 cursor-pointer" onClick={() => updateFilters({ category: selectedCategoryData.slug, subCategory: null, page: 1 })}>
                          {selectedCategoryData.name}
                        </span>
                      </>
                    )}
                    {currentSubCategory && selectedSubCategoryData && (
                      <>
                        <span>&gt;</span>
                        <span className="font-semibold text-gray-700">
                          {selectedSubCategoryData.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Search Box */}
                <form onSubmit={handleSearchSubmit} className="w-full md:w-[420px] flex gap-2 relative">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-5 pr-14 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#ffc800] hover:bg-[#e6b400] text-gray-950 p-2.5 rounded-full shadow-sm transition-colors"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sticky Filter pills row */}
          <div className="bg-white border-b border-gray-150 py-3 px-4 shadow-sm sticky top-[112px] sm:top-[64px] z-30">
            <div className="max-w-6xl mx-auto relative flex items-center w-full group/filterbar">
              {/* Left scroll button */}
              {showLeftScroll && (
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center z-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
              )}

              {/* Left gradient fade */}
              {showLeftScroll && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 w-full select-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Refine pill */}
                <button
                  type="button"
                  onClick={() => setIsRefineOpen(true)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#FF6600]/30 bg-[#FF6600]/5 text-xs text-[#FF6600] font-bold hover:bg-[#FF6600]/10 transition-colors"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Refine</span>
                </button>

                {/* Location pill */}
                <button
                  type="button"
                  onClick={() => setIsLocationOpen(true)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700 font-semibold transition-all"
                >
                  <span>{currentLocalArea || currentDistrict}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                {/* Category filter pill */}
                {selectedCategoryData ? (
                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#FF6600]/30 bg-[#FF6600]/5 text-xs text-[#FF6600] font-bold">
                    <span 
                      onClick={() => setIsCategoryOpen(true)}
                      className="cursor-pointer hover:underline"
                    >
                      {selectedSubCategoryData?.name || selectedCategoryData.name}
                    </span>
                    <button 
                      onClick={() => updateFilters({ category: "", subCategory: null, page: 1 })}
                      className="hover:bg-[#FF6600]/20 p-0.5 rounded-full transition-colors ml-0.5"
                      aria-label="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(true)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700 font-semibold transition-all"
                  >
                    <span>Category</span>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </button>
                )}

                {/* Price Filter Pill */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all
                      ${(currentMinPrice || currentMaxPrice) 
                        ? "border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600] font-bold" 
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    <span>
                      {(currentMinPrice || currentMaxPrice)
                        ? `Price: LKR ${currentMinPrice || "0"} - ${currentMaxPrice || "Max"}`
                        : "Price"
                      }
                    </span>
                    {(currentMinPrice || currentMaxPrice) ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFilters({ minPrice: null, maxPrice: null, page: 1 });
                        }}
                        className="hover:bg-[#FF6600]/20 p-0.5 rounded-full transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </button>

                  {openDropdown === "price" && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                      <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 p-4 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Min Price (Rs.)</label>
                          <input
                            type="number"
                            placeholder="Min"
                            value={tempMinPrice}
                            onChange={(e) => setTempMinPrice(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6600]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Max Price (Rs.)</label>
                          <input
                            type="number"
                            placeholder="Max"
                            value={tempMaxPrice}
                            onChange={(e) => setTempMaxPrice(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6600]"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            updateFilters({
                              minPrice: tempMinPrice || null,
                              maxPrice: tempMaxPrice || null,
                              page: 1,
                            });
                            setOpenDropdown(null);
                          }}
                          className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl text-xs font-bold py-2 shadow-sm"
                        >
                          Apply Price
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Dynamic Specification dropdown pills */}
                {selectedSubCategoryData?.fieldDefinitions && (selectedSubCategoryData.fieldDefinitions as any[]).map((field) => {
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

                  const selectedVal = searchParams.get(field.fieldKey);

                  return (
                    <div key={field.id} className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === field.fieldKey ? null : field.fieldKey)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all
                          ${selectedVal
                            ? "border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600] font-bold"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        <span>
                          {selectedVal ? `${field.label}: ${selectedVal}` : field.label}
                        </span>
                        {selectedVal ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFilters({ [field.fieldKey]: null, page: 1 });
                            }}
                            className="hover:bg-[#FF6600]/20 p-0.5 rounded-full transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        ) : (
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        )}
                      </button>

                      {openDropdown === field.fieldKey && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 py-2 max-h-60 overflow-y-auto">
                            {options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  updateFilters({ [field.fieldKey]: opt, page: 1 });
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Clear all button */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      router.push("/marketplace?category=");
                    }}
                    className="flex-shrink-0 text-xs text-red-500 font-bold hover:text-red-600 transition-colors ml-4 mr-2 whitespace-nowrap"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Right gradient fade */}
              {showRightScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
              )}

              {/* Right scroll button */}
              {showRightScroll && (
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center z-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {!hasActiveFilters ? (
          /* ---------------- LANDING VIEW STATE ---------------- */
          <div className="space-y-8">


            {/* Browse items by category */}
            <div className="space-y-4">
              <h2 className="text-base font-black text-gray-900 tracking-tight">Browse items by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const adCount = getCategoryCount(cat);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => updateFilters({ category: cat.slug, page: 1 })}
                      className="flex flex-col items-center justify-center min-h-[160px] p-5 bg-white border border-gray-100 rounded-[1.5rem] hover:border-orange-100 hover:bg-orange-50/10 text-center transition-all hover:shadow-md hover:-translate-y-1 duration-300"
                    >
                      <span className="text-xl w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                          <img src={cat.icon} alt={cat.name} className="w-12 h-12 object-contain" />
                        ) : (
                          cat.icon || "📁"
                        )}
                      </span>
                      <div className="min-w-0 mt-3 flex flex-col items-center">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight break-words text-center">{cat.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1 text-center">{adCount.toLocaleString()} ads</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Ads Carousel */}
            {featuredAds.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                  <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                  <span>Featured Advertisements</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredAds.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}

            {/* Latest Ads Grid */}
            <div className="space-y-4">
              <h2 className="text-base font-black text-gray-900">Latest Classified Ads</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-2 py-12 text-center text-gray-400">
                    <LoaderSpinner />
                  </div>
                ) : ads.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-gray-400 bg-white border rounded-2xl">
                    No classified ads available.
                  </div>
                ) : (
                  ads.map((ad) => <AdCard key={ad.id} ad={ad} />)
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ---------------- SEARCH LISTING STATE ---------------- */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Filter pane: Subcategory list */}
            <div className="hidden lg:block space-y-6 lg:col-span-1">
              <CardBorderWrapper>
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">All Categories</span>
                  <button onClick={() => updateFilters({ category: "", subCategory: null, page: 1 })} className="text-[10px] text-red-500 font-bold">Clear</button>
                </div>
                <div className="p-3 space-y-1.5">
                  {categories.map((cat) => {
                    const isCatSelected = currentCategory === cat.slug;
                    const catCount = getCategoryCount(cat);

                    return (
                      <div key={cat.id} className="space-y-1">
                        <button
                          onClick={() => updateFilters({ category: cat.slug, subCategory: null, page: 1 })}
                          className={`w-full flex items-center justify-between text-left text-xs px-2 py-1.5 rounded-lg ${
                            isCatSelected ? "font-bold text-[#FF6600] bg-orange-50/20" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                              <img src={cat.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
                            ) : (
                              <span>{cat.icon}</span>
                            )}
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <span className="text-[9px] text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded">{catCount}</span>
                        </button>

                        {/* List subcategories if category is active */}
                        {isCatSelected && (
                          <div className="pl-4 space-y-1 border-l border-orange-100 ml-3.5 pt-0.5">
                            {cat.subCategories.map((sub: any) => {
                              const isSubSelected = currentSubCategory === sub.slug;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => updateFilters({ subCategory: sub.slug, page: 1 })}
                                  className={`w-full flex items-center justify-between text-[11px] px-2 py-1 rounded-lg ${
                                    isSubSelected ? "font-bold text-[#FF6600] bg-orange-50/10" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  <span className="text-[8px] text-gray-400 font-normal">({sub._count?.ads || 0})</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBorderWrapper>
            </div>

            {/* Center listing pane */}
            <div className="lg:col-span-2 space-y-4">
              {/* Refinement info row */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 font-bold">
                  Showing {ads.length > 0 ? `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}` : "0"} of {pagination.totalCount} ads
                </span>

                {/* Sort controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Sort by:</span>
                  <select
                    value={currentSort}
                    onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
                    className="text-xs font-semibold bg-gray-50 border border-gray-150 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="newest">Newest first</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="popular">Popular (Views)</option>
                  </select>
                </div>
              </div>

              {/* Main List */}
              {isLoading ? (
                <div className="py-20 text-center text-gray-400">
                  <LoaderSpinner />
                </div>
              ) : ads.length === 0 ? (
                <div className="py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  No classified ads found matching your refinement filters.
                </div>
              ) : (
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} ads matching)
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => updateFilters({ page: pagination.page - 1 })}
                          className="rounded-xl text-xs bg-white text-gray-900 border-gray-200"
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => updateFilters({ page: pagination.page + 1 })}
                          className="rounded-xl text-xs bg-white text-gray-900 border-gray-200"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right panel: Mock sidebar advertising slot */}
            <div className="lg:col-span-1 hidden lg:block space-y-4">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl overflow-hidden shadow-md text-center p-6 border border-indigo-950 relative min-h-[400px] flex flex-col justify-between">
                <div>
                  <span className="bg-yellow-500 text-black hover:bg-yellow-600 border-none font-extrabold uppercase text-[9px] px-2.5 py-0.5 rounded-full inline-block">
                    Sponsor Ad
                  </span>
                  <h3 className="text-xl font-black mt-4 tracking-tight leading-snug">
                    R.S. 250.00 FREE BONUS ON SOCCER!
                  </h3>
                  <p className="text-indigo-200 text-xs mt-2.5 font-medium">
                    Enjoy first deposit play rewards instantly via BetSS portal.
                  </p>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto text-yellow-400 font-extrabold text-2xl shadow-inner">
                    🎰
                  </div>
                  <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full rounded-xl text-xs py-5">
                    Click Here
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LocationPicker
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onSelect={handleLocationSelect}
        showResetAndPostCount={true}
        initialDistrict={currentDistrict}
        initialLocalArea={currentLocalArea}
      />
      <CategoryPicker
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        onSelect={handleCategorySelect}
        showResetAndPostCount={true}
        initialCategoryId={selectedCategoryData?.id}
        initialSubCategoryId={selectedSubCategoryData?.id}
      />
      <RefineSearchDialog
        isOpen={isRefineOpen}
        onClose={() => setIsRefineOpen(false)}
        categories={categories}
        selectedCategoryData={selectedCategoryData}
        selectedSubCategoryData={selectedSubCategoryData}
        currentDistrict={currentDistrict}
        currentLocalArea={currentLocalArea}
        currentMinPrice={currentMinPrice}
        currentMaxPrice={currentMaxPrice}
        currentSort={currentSort}
        currentSearch={currentSearch}
        activeSpecs={activeSpecs}
        onOpenLocation={() => {
          setIsLocationOpen(true);
        }}
        onOpenCategory={() => {
          setIsCategoryOpen(true);
        }}
        onApply={(filters) => {
          updateFilters(filters);
        }}
      />
    </div>
  );
}

export default function MarketplacePortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <LoaderSpinner />
      </div>
    }>
      <MarketplacePortalPageContent />
    </Suspense>
  );
}

function CardBorderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
      <p className="text-xs font-semibold">Fetching marketplace listings...</p>
    </div>
  );
}
