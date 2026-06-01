"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Loader2,
  Search,
  Smartphone,
  Headphones,
  Wrench,
  Watch,
  Laptop,
  Mouse,
  Tv,
  Cast,
  Camera,
  Mic,
  Settings,
  Fan,
  Gamepad2,
  Speaker,
  Car,
  Bike,
  Truck,
  Bus,
  Compass,
  HardHat,
  Tractor,
  Key,
  Ship,
  Map,
  Home,
  Building2,
  Briefcase,
  Sofa,
  Bath,
  Sprout,
  Palette,
  Lamp,
  Utensils,
  PawPrint,
  Bone,
  HeartPulse,
  Scissors,
  Plane,
  Music,
  Heart,
  Printer,
  Sun,
  Layers,
  FileText,
  Stethoscope,
  Hammer,
  Dumbbell,
  Activity,
  Ticket,
  BookOpen,
  Baby,
  Trophy,
  ShoppingBag,
  Shirt,
  Footprints,
  Gem,
  Glasses,
  GraduationCap,
  School,
  Leaf,
  Package,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUBCATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Mobiles
  "mobile-phones": Smartphone,
  "mobile-phone-accessories": Headphones,
  "mobile-spare-parts": Wrench,
  "smartwatches-fitness": Watch,

  // Electronics
  "computers-tablets": Laptop,
  "computer-accessories": Mouse,
  "tvs": Tv,
  "tv-video-accessories": Cast,
  "cameras": Camera,
  "audio-mp3": Mic,
  "home-appliances": Settings,
  "electrical-fittings": Fan,
  "video-games": Gamepad2,
  "other-electronics": Speaker,

  // Vehicles
  "cars": Car,
  "motorbikes": Bike,
  "three-wheelers": Car,
  "bicycles": Bike,
  "vans": Truck,
  "buses": Bus,
  "lorries-trucks": Truck,
  "heavy-duty": HardHat,
  "tractors": Tractor,
  "auto-services": Wrench,
  "rentals": Key,
  "auto-parts": Settings,
  "vehicle-maintenance": Wrench,
  "boats": Ship,

  // Property
  "land": Map,
  "houses": Home,
  "apartments": Building2,
  "commercial-properties": Briefcase,

  // Home & Garden
  "furniture": Sofa,
  "bathroom-sanitary": Bath,
  "garden": Sprout,
  "home-decor": Palette,
  "kitchen-items": Utensils,
  "other-home-items": Home,

  // Animals
  "pets": PawPrint,
  "pet-food": Bone,
  "vet-services": HeartPulse,
  "farm-animals": PawPrint,
  "animal-accessories": Scissors,
  "other-animals": PawPrint,

  // Services
  "trade-services": Wrench,
  "domestic-services": Home,
  "events-entertainment": Music,
  "health-wellbeing": Heart,
  "travel-tourism": Plane,
  "other-services": Briefcase,

  // Business & Industry
  "office-equipment-supplies": Printer,
  "solar-generators": Sun,
  "industry-machinery": Wrench,
  "raw-materials": Layers,
  "licences-titles": FileText,
  "medical-equipment": Stethoscope,
  "building-materials": Hammer,
  "other-business-services": Briefcase,

  // Hobby, Sport & Kids
  "musical-instruments": Music,
  "sports-fitness": Dumbbell,
  "sports-supplements": Activity,
  "travel-tickets": Ticket,
  "art-collectibles": Palette,
  "music-books-movies": BookOpen,
  "childrens-items": Baby,
  "other-hobby-items": Trophy,

  // Fashion & Beauty
  "bags-luggage": ShoppingBag,
  "clothing": Shirt,
  "shoes-footwear": Footprints,
  "jewellery": Gem,
  "sunglasses-opticians": Glasses,
  "watches": Watch,
  "fashion-accessories": Sparkles,
  "beauty-products": Sparkles,
  "other-personal-items": Heart,

  // Essentials
  "grocery-essentials": ShoppingBag,

  // Education
  "higher-education": GraduationCap,
  "textbooks": BookOpen,
  "tuition": BookOpen,
  "vocational-institutes": School,
  "other-education": GraduationCap,

  // Agriculture
  "crops-seeds": Sprout,
  "farming-machinery": Tractor,
  "other-agriculture": Leaf,

  // Other
  "other-items": Package,
};


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

interface CategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (
    categoryId: string,
    subCategoryId: string,
    categoryName: string,
    subCategoryName: string,
    fieldDefinitions: FieldDefinition[]
  ) => void;
  onlyParentCategory?: boolean;
  onSelectParent?: (categoryId: string, categoryName: string) => void;
  initialCategoryId?: string;
  initialSubCategoryId?: string;
  showResetAndPostCount?: boolean;
}

export function CategoryPicker({
  isOpen,
  onClose,
  onSelect,
  onlyParentCategory = false,
  onSelectParent,
  initialCategoryId,
  initialSubCategoryId,
  showResetAndPostCount = false,
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileView, setMobileView] = useState<"categories" | "subcategories">(initialCategoryId ? "subcategories" : "categories");

  useEffect(() => {
    if (isOpen) {
      if (initialCategoryId) {
        setMobileView("subcategories");
      } else {
        setMobileView("categories");
      }
    }
  }, [isOpen, initialCategoryId]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/ads/public/categories");
        const json = await response.json();
        if (json.success) {
          setCategories(json.data);
          if (initialCategoryId) {
            setSelectedParentId(initialCategoryId);
            setSelectedSubId(initialSubCategoryId || null);
          } else if (json.data.length > 0 && !showResetAndPostCount) {
            setSelectedParentId(json.data[0].id);
          }
        } else {
          setError(json.error || "Failed to load categories.");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("An error occurred while loading categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen, initialCategoryId, initialSubCategoryId]);

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      if (initialCategoryId) {
        setSelectedParentId(initialCategoryId);
        setSelectedSubId(initialSubCategoryId || null);
      } else if (!showResetAndPostCount) {
        setSelectedParentId(categories[0].id);
        setSelectedSubId(null);
      }
    }
  }, [initialCategoryId, initialSubCategoryId, isOpen, categories]);

  const selectedCategory = categories.find((c) => c.id === selectedParentId);

  // Filter categories based on search query
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subCategories.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleParentSelect = (cat: Category) => {
    setSelectedParentId(cat.id);
    setSelectedSubId(null);
    if (!showResetAndPostCount && onlyParentCategory && onSelectParent) {
      onSelectParent(cat.id, cat.name);
      onClose();
    } else {
      setMobileView("subcategories");
    }
  };

  const handleSubSelect = (sub: SubCategory) => {
    if (showResetAndPostCount) {
      setSelectedSubId(sub.id);
    } else {
      if (onSelect && selectedCategory) {
        onSelect(
          selectedCategory.id,
          sub.id,
          selectedCategory.name,
          sub.name,
          sub.fieldDefinitions
        );
        onClose();
      }
    }
  };

  // Calculate display counts
  const totalCountAll = categories.reduce(
    (sum, cat) => sum + cat.subCategories.reduce((s: number, sub: any) => s + (sub._count?.ads || 0), 0),
    0
  );

  const totalCountCat = selectedCategory
    ? selectedCategory.subCategories.reduce((s: number, sub: any) => s + (sub._count?.ads || 0), 0)
    : 0;

  const selectedSub = selectedCategory?.subCategories.find((s) => s.id === selectedSubId);
  const totalCountSub = selectedSub?._count?.ads || 0;

  let displayCount = totalCountAll;
  if (selectedParentId && selectedSubId) {
    displayCount = totalCountSub;
  } else if (selectedParentId) {
    displayCount = totalCountCat;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[80vh] md:h-[600px] p-0 overflow-hidden flex flex-col rounded-2xl border border-gray-100 shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>{mobileView === "categories" ? "Select a Category" : "Select a subcategory"}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm mt-1">
            {onlyParentCategory
              ? "Choose the primary sector for your business"
              : "Choose a category and sub-category for your ad"}
          </DialogDescription>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search categories or sub-categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-all"
            />
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600] mb-2" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-6 text-center">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="flex-grow flex overflow-hidden">
            {/* Left Panel: Categories */}
            <div className={cn(
              "border-r border-gray-150 flex flex-col bg-gray-50/50 w-full md:w-[40%]",
              onlyParentCategory ? "w-full border-r-0" : "",
              !onlyParentCategory && mobileView === "subcategories" && "hidden md:flex"
            )}>
              <ScrollArea className="flex-1">
                <div className="p-1 md:p-2 space-y-1">
                  {showResetAndPostCount && (
                    <button
                      onClick={() => {
                        setSelectedParentId(null);
                        setSelectedSubId(null);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-2.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold hover:underline mb-2 text-blue-600",
                        selectedParentId === null && "text-[#FF6600] font-bold"
                      )}
                    >
                      All Categories
                    </button>
                  )}
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleParentSelect(cat)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-left text-xs md:text-sm font-medium transition-all duration-200",
                        selectedParentId === cat.id
                          ? "bg-white text-[#FF6600] shadow-sm border border-gray-100 font-semibold"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <span className="flex items-center gap-1.5 md:gap-3 min-w-0">
                        <span className="text-sm md:text-xl flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-white shadow-sm border border-gray-50 flex-shrink-0">
                          {cat.icon || "📁"}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </span>
                      {!onlyParentCategory && (
                        <ChevronRight className={cn(
                          "h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 transition-transform hidden sm:block",
                          selectedParentId === cat.id && "text-[#FF6600] translate-x-0.5"
                        )} />
                      )}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No categories found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel: Sub-Categories */}
            {!onlyParentCategory && (
              <div className={cn(
                "md:w-1/2 flex flex-col bg-white",
                mobileView === "categories" ? "hidden md:flex w-[60%]" : "w-full"
              )}>
                {/* Back to all categories link (mobile only) */}
                <button
                  type="button"
                  onClick={() => setMobileView("categories")}
                  className="md:hidden flex items-center gap-2 px-4 py-3 text-xs font-bold text-gray-650 hover:underline border-b border-gray-100 text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to all categories</span>
                </button>

                <div className="px-3 py-2.5 md:px-6 md:py-3 border-b border-gray-50 bg-gray-50/30">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider truncate block">
                    {selectedCategory ? `${selectedCategory.name} Subcategories` : "Subcategories"}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 md:p-3 space-y-1">
                    {showResetAndPostCount && selectedCategory && (
                      <button
                        onClick={() => {
                          setSelectedSubId(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold hover:underline mb-2 text-blue-600",
                          selectedSubId === null && "text-[#FF6600] font-bold"
                        )}
                      >
                        All {selectedCategory.name}
                      </button>
                    )}
                    {selectedCategory?.subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubSelect(sub)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-left text-xs md:text-sm font-medium transition-all duration-200 group",
                          selectedSubId === sub.id
                            ? "bg-orange-50/50 text-[#FF6600] font-semibold border border-orange-100/50 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#FF6600]"
                        )}
                      >
                        <span className="flex items-center gap-1.5 md:gap-3 min-w-0">
                          <span className="text-sm md:text-xl flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-white shadow-sm border border-gray-50 flex-shrink-0">
                            {(() => {
                              if (sub.icon) return sub.icon;
                              const IconComponent = SUBCATEGORY_ICONS[sub.slug];
                              if (IconComponent) {
                                return (
                                  <IconComponent className={cn(
                                    "h-4 w-4 md:h-5 md:w-5 text-gray-500 transition-colors group-hover:text-[#FF6600]",
                                    selectedSubId === sub.id && "text-[#FF6600]"
                                  )} />
                                );
                              }
                              return "📁";
                            })()}
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-transparent group-hover:text-[#FF6600] group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </button>
                    ))}
                    {(!selectedCategory || selectedCategory.subCategories.length === 0) && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Select a category on the left
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {showResetAndPostCount && !loading && !error && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => {
                setSelectedParentId(null);
                setSelectedSubId(null);
                setMobileView("categories");
              }}
              className="px-5 py-2 border border-teal-605 hover:bg-teal-50/50 text-teal-700 text-sm font-bold rounded-xl transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => {
                if (onSelect) {
                  if (selectedParentId) {
                    const cat = categories.find((c) => c.id === selectedParentId);
                    const sub = cat?.subCategories.find((s) => s.id === selectedSubId);
                    onSelect(
                      selectedParentId,
                      selectedSubId || "",
                      cat?.name || "",
                      sub?.name || "",
                      sub?.fieldDefinitions || []
                    );
                  } else {
                    onSelect("", "", "", "", []);
                  }
                }
                onClose();
              }}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md transition-all"
            >
              Show {displayCount.toLocaleString()} posts
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
