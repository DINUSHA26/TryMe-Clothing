"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>Select Category</span>
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
              "w-full border-r border-gray-100 flex flex-col bg-gray-50/50",
              onlyParentCategory ? "w-full border-r-0" : "md:w-1/2 w-[45%]"
            )}>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {showResetAndPostCount && (
                    <button
                      onClick={() => {
                        setSelectedParentId(null);
                        setSelectedSubId(null);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm font-semibold hover:underline mb-2 text-blue-600",
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
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200",
                        selectedParentId === cat.id
                          ? "bg-white text-[#FF6600] shadow-sm border border-gray-100 font-semibold"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-50">
                          {cat.icon || "📁"}
                        </span>
                        <span>{cat.name}</span>
                      </span>
                      {!onlyParentCategory && (
                        <ChevronRight className={cn(
                          "h-4 w-4 text-gray-400 transition-transform",
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
              <div className="md:w-1/2 w-[55%] flex flex-col bg-white">
                <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/30">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {selectedCategory ? `${selectedCategory.name} Subcategories` : "Subcategories"}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {showResetAndPostCount && selectedCategory && (
                      <button
                        onClick={() => {
                          setSelectedSubId(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm font-semibold hover:underline mb-2 text-blue-600",
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
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 group",
                          selectedSubId === sub.id
                            ? "bg-orange-50/50 text-[#FF6600] font-semibold border border-orange-100/50 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#FF6600]"
                        )}
                      >
                        <span>{sub.name}</span>
                        <ChevronRight className="h-4 w-4 text-transparent group-hover:text-[#FF6600] group-hover:translate-x-0.5 transition-all" />
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
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => {
                setSelectedParentId(null);
                setSelectedSubId(null);
              }}
              className="px-5 py-2 border border-teal-600 hover:bg-teal-50/50 text-teal-700 text-sm font-bold rounded-xl transition-all"
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
