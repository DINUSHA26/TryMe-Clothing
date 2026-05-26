"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { X, ChevronDown, ChevronRight, Plus, Minus, SlidersHorizontal } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    children?: Category[];
}

interface Vendor {
    id: string;
    businessName: string;
    slug: string;
}

interface SidebarFiltersProps {
    categories: Category[];
    vendors: Vendor[];
    activeCategoryId?: string;
    basePath?: string;
}

export function SidebarFilters({ categories, vendors, activeCategoryId, basePath = '/products' }: SidebarFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse filters from URL or use injected path ID
    const selectedCategoryId = searchParams.get("categoryId") || activeCategoryId || "";
    const selectedVendors = searchParams.getAll("vendorId");
    const selectedSizes = searchParams.getAll("size");
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";

    // Mobile buffered state (only applied on "Apply Filters")
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileCategoryId, setMobileCategoryId] = useState(selectedCategoryId);
    const [mobileVendors, setMobileVendors] = useState<string[]>(selectedVendors);
    const [mobileSizes, setMobileSizes] = useState<string[]>(selectedSizes);
    const [mobileMinPrice, setMobileMinPrice] = useState(minPrice);
    const [mobileMaxPrice, setMobileMaxPrice] = useState(maxPrice);

    // Sync mobile state when sheet opens (so it reflects current URL state)
    const handleSheetOpen = (open: boolean) => {
        if (open) {
            setMobileCategoryId(selectedCategoryId);
            setMobileVendors([...selectedVendors]);
            setMobileSizes([...selectedSizes]);
            setMobileMinPrice(minPrice);
            setMobileMaxPrice(maxPrice);
        }
        setMobileOpen(open);
    };

    // Updated available sizes
    // Expanded available sizes including plus sizes, shirt neck sizes, and waist sizes
    const availableSizes = [
        "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL",
        "15", "15.5", "16", "16.5", "17", "17.5",
        "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"
    ];

    // Expanded states
    const [expandedCats, setExpandedCats] = useState<string[]>([]);
    const [categoriesOpen, setCategoriesOpen] = useState(true);
    const [sizeOpen, setSizeOpen] = useState(true);
    const [brandOpen, setBrandOpen] = useState(true);

    // Auto-expand category if selected
    useEffect(() => {
        if (selectedCategoryId) {
            const parentCat = categories.find(c => c.children?.some(child => child.id === selectedCategoryId));
            if (parentCat && !expandedCats.includes(parentCat.id)) {
                setExpandedCats(prev => [...prev, parentCat.id]);
            }
        }
    }, [selectedCategoryId, categories]);

    // --- Desktop: immediate URL updates ---
    const updateURL = (key: string, value: string | string[] | null) => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset page on filter change
        params.set("page", "1");

        if (Array.isArray(value)) {
            params.delete(key);
            value.forEach(v => params.append(key, v));
        } else if (value === null || value === "") {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        router.push(`${basePath}?${params.toString()}`, { scroll: false });
    };

    const toggleCategoryExpand = (catId: string) => {
        setExpandedCats(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
        const currentList = searchParams.getAll(key);
        let newList;
        if (checked) {
            newList = [...currentList, value];
        } else {
            newList = currentList.filter(v => v !== value);
        }
        updateURL(key, newList.length > 0 ? newList : null);
    };

    const handlePriceChange = (min: string, max: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (min) params.set("minPrice", min); else params.delete("minPrice");
        if (max) params.set("maxPrice", max); else params.delete("maxPrice");
        router.push(`${basePath}?${params.toString()}`, { scroll: false });
    };

    const clearAll = () => {
        router.push(basePath, { scroll: false });
    };

    // --- Mobile: buffered state helpers ---
    const applyMobileFilters = () => {
        const params = new URLSearchParams();
        params.set("page", "1");
        // Preserve non-filter params like search and sortBy
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy");
        if (search) params.set("search", search);
        if (sortBy) params.set("sortBy", sortBy);

        if (mobileCategoryId) params.set("categoryId", mobileCategoryId);
        mobileVendors.forEach(v => params.append("vendorId", v));
        mobileSizes.forEach(s => params.append("size", s));
        if (mobileMinPrice) params.set("minPrice", mobileMinPrice);
        if (mobileMaxPrice) params.set("maxPrice", mobileMaxPrice);

        router.push(`${basePath}?${params.toString()}`, { scroll: false });
        setMobileOpen(false);
    };

    const clearMobileFilters = () => {
        setMobileCategoryId("");
        setMobileVendors([]);
        setMobileSizes([]);
        setMobileMinPrice("");
        setMobileMaxPrice("");
    };

    const toggleMobileVendor = (id: string) => {
        setMobileVendors(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const toggleMobileSize = (size: string) => {
        setMobileSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const hasActiveFilters = selectedCategoryId || selectedVendors.length > 0 || selectedSizes.length > 0 || minPrice || maxPrice;
    const hasMobileChanges = mobileCategoryId || mobileVendors.length > 0 || mobileSizes.length > 0 || mobileMinPrice || mobileMaxPrice;

    // Desktop filter content (applies immediately on click)
    const desktopFilterContent = (
        <div className="w-full bg-white dark:bg-transparent text-sm pb-8 pr-2">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="text-lg font-bold tracking-widest text-[#1a1a1a] dark:text-white">CATEGORIES</h2>
                {hasActiveFilters && (
                    <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-black dark:hover:text-white">
                        Clear All
                    </button>
                )}
            </div>

            <div className="py-4 space-y-6">
                {/* Categories Tree */}
                <div className="space-y-3">
                    <button
                        className="flex items-center text-[#1a1a1a] dark:text-gray-200 text-sm uppercase font-semibold group w-full text-left"
                        onClick={() => updateURL("categoryId", null)}
                    >
                        <ChevronRight className="w-4 h-4 mr-2 opacity-0" />
                        NEW ARRIVALS
                    </button>

                    {categories.map((cat) => (
                        <div key={cat.id} className="space-y-2">
                            <div className="flex items-center group">
                                {cat.children && cat.children.length > 0 ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(cat.id); }}
                                        className="mr-3 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-500 transition-colors shrink-0"
                                    >
                                        {expandedCats.includes(cat.id) ? (
                                            <Minus className="w-3.5 h-3.5 stroke-[3px]" />
                                        ) : (
                                            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-8 shrink-0" />
                                )}

                                <div
                                    className={`flex-1 cursor-pointer transition-all ${selectedCategoryId === cat.id ? "font-bold text-black dark:text-white" : "text-[#333] dark:text-gray-300 font-medium hover:text-black dark:hover:text-white"}`}
                                    onClick={() => updateURL("categoryId", cat.id)}
                                >
                                    <span className="uppercase text-[13px] tracking-wide">{cat.name}</span>
                                </div>
                            </div>

                            {cat.children && cat.children.length > 0 && expandedCats.includes(cat.id) && (
                                <div className="pl-11 space-y-2 mt-1 border-l border-gray-100 dark:border-slate-800 ml-[15px]">
                                    {cat.children.map((child) => (
                                        <div
                                            key={child.id}
                                            className={`text-[12px] tracking-wide cursor-pointer uppercase py-1 transition-colors ${selectedCategoryId === child.id ? "font-bold text-black dark:text-white underline underline-offset-4 decoration-primary" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
                                            onClick={() => updateURL("categoryId", child.id)}
                                        >
                                            {child.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t pt-6" />

                {/* SIZE filter */}
                <div className="space-y-3">
                    <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase mb-4">SIZE</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => {
                                    const isSelected = selectedSizes.includes(size);
                                    handleCheckboxChange("size", size, !isSelected);
                                }}
                                className={`min-w-[40px] px-2 py-1.5 text-xs text-center border ${selectedSizes.includes(size) ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t pt-6" />

                {/* SHOP NAME filter */}
                {vendors.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase mb-4">SHOP NAME</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {vendors.map((vendor) => (
                                <div key={vendor.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`brand-${vendor.id}`}
                                        checked={selectedVendors.includes(vendor.id)}
                                        onCheckedChange={(checked) => handleCheckboxChange("vendorId", vendor.id, checked as boolean)}
                                        className="rounded border-gray-300 dark:border-slate-700"
                                    />
                                    <Label htmlFor={`brand-${vendor.id}`} className="text-[13px] font-normal cursor-pointer text-[#333] dark:text-gray-300 leading-none">
                                        {vendor.businessName}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t pt-6" />

                {/* PRICE filter */}
                <div className="space-y-4">
                    <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase mb-4">PRICE</h3>
                    <div className="flex flex-col gap-4">
                        <Slider
                            defaultValue={[Number(minPrice) || 0, Number(maxPrice) || 50000]}
                            max={50000}
                            step={100}
                            onValueChange={(value) => handlePriceChange(value[0].toString(), value[1].toString())}
                        />
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span>Rs. {Number(minPrice) || 0}</span>
                            <span>Rs. {Number(maxPrice) || 50000}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );

    // Mobile filter content (uses local buffered state, applies only on button click)
    const mobileFilterContent = (
        <div className="w-full text-sm pb-4">
            <div className="py-4 space-y-6">
                {/* Categories */}
                <div className="space-y-3">
                    <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase">CATEGORIES</h3>
                    <button
                        className={`flex items-center text-sm uppercase font-semibold w-full text-left ${!mobileCategoryId ? "text-black dark:text-white font-bold" : "text-[#333] dark:text-gray-300"}`}
                        onClick={() => setMobileCategoryId("")}
                    >
                        <ChevronRight className="w-4 h-4 mr-2 opacity-0" />
                        ALL / NEW ARRIVALS
                    </button>
                    {categories.map((cat) => (
                        <div key={cat.id} className="space-y-2">
                            <div className="flex items-center">
                                {cat.children && cat.children.length > 0 ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(cat.id); }}
                                        className="mr-3 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-500 shrink-0"
                                    >
                                        {expandedCats.includes(cat.id) ? <Minus className="w-3.5 h-3.5 stroke-[3px]" /> : <Plus className="w-3.5 h-3.5 stroke-[3px]" />}
                                    </button>
                                ) : <div className="w-8 shrink-0" />}
                                <div
                                    className={`flex-1 cursor-pointer transition-all ${mobileCategoryId === cat.id ? "font-bold text-black dark:text-white" : "text-[#333] dark:text-gray-300 font-medium hover:text-black dark:hover:text-white"}`}
                                    onClick={() => setMobileCategoryId(cat.id)}
                                >
                                    <span className="uppercase text-[13px] tracking-wide">{cat.name}</span>
                                </div>
                            </div>
                            {cat.children && cat.children.length > 0 && expandedCats.includes(cat.id) && (
                                <div className="pl-11 space-y-2 mt-1 border-l border-gray-100 dark:border-slate-800 ml-[15px]">
                                    {cat.children.map((child) => (
                                        <div
                                            key={child.id}
                                            className={`text-[12px] tracking-wide cursor-pointer uppercase py-1 ${mobileCategoryId === child.id ? "font-bold text-black dark:text-white underline underline-offset-4 decoration-primary" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
                                            onClick={() => setMobileCategoryId(child.id)}
                                        >
                                            {child.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4" />

                {/* SIZE */}
                <div className="space-y-3">
                    <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase">SIZE</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => toggleMobileSize(size)}
                                className={`min-w-[40px] px-2 py-1.5 text-xs text-center border ${mobileSizes.includes(size) ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t pt-4" />

                {/* SHOP NAME */}
                {vendors.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase">SHOP NAME</h3>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                            {vendors.map((vendor) => (
                                <div key={vendor.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`mobile-brand-${vendor.id}`}
                                        checked={mobileVendors.includes(vendor.id)}
                                        onCheckedChange={() => toggleMobileVendor(vendor.id)}
                                        className="rounded border-gray-300 dark:border-slate-700"
                                    />
                                    <Label htmlFor={`mobile-brand-${vendor.id}`} className="text-[13px] font-normal cursor-pointer text-[#333] dark:text-gray-300 leading-none">
                                        {vendor.businessName}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t pt-4" />

                {/* PRICE */}
                <div className="space-y-4">
                    <h3 className="text-base font-bold tracking-widest text-[#1a1a1a] dark:text-white uppercase">PRICE</h3>
                    <Slider
                        defaultValue={[Number(mobileMinPrice) || 0, Number(mobileMaxPrice) || 50000]}
                        max={50000}
                        step={100}
                        onValueChange={(value) => { setMobileMinPrice(value[0].toString()); setMobileMaxPrice(value[1].toString()); }}
                    />
                    <div className="flex items-center justify-between text-sm font-medium">
                        <span>Rs. {Number(mobileMinPrice) || 0}</span>
                        <span>Rs. {Number(mobileMaxPrice) || 50000}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sticky Sidebar */}
            <div className="hidden lg:block sticky top-[80px] max-h-[calc(100vh-80px)] overflow-y-auto w-[280px] custom-scrollbar">
                {desktopFilterContent}
            </div>

            {/* Mobile Slide-out Drawer */}
            <div className="lg:hidden w-full mb-6">
                <Sheet open={mobileOpen} onOpenChange={handleSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-dashed border-2 h-11 relative">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="font-bold tracking-widest uppercase">Filters & Categories</span>
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center">!</span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-[2rem] p-0 overflow-hidden">
                        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 shrink-0">
                            <SheetTitle className="text-lg font-bold tracking-widest uppercase">Filters & Categories</SheetTitle>
                            {hasMobileChanges && (
                                <button onClick={clearMobileFilters} className="text-xs text-muted-foreground hover:text-black dark:hover:text-white underline">
                                    Clear All
                                </button>
                            )}
                        </SheetHeader>

                        {/* Scrollable filter area */}
                        <div className="flex-1 overflow-y-auto px-6">
                            {mobileFilterContent}
                        </div>

                        {/* Sticky Apply Button at bottom */}
                        <div className="shrink-0 border-t px-6 py-4 bg-background">
                            <Button
                                onClick={applyMobileFilters}
                                className="w-full h-12 text-base font-bold tracking-widest uppercase"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
