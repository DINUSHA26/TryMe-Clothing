"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface LinkedCategorySelectorProps {
    value: string;
    onValueChange: (value: string) => void;
}

// Module-level cache across component instances for 0ms immediate render
let cachedCategories: Category[] | null = null;
let categoryFetchPromise: Promise<Category[]> | null = null;

export function LinkedCategorySelector({ value, onValueChange }: LinkedCategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
    const [isLoading, setIsLoading] = useState(!cachedCategories);
    const [mainCategoryId, setMainCategoryId] = useState<string>("");

    useEffect(() => {
        let isMounted = true;
        const fetchCategories = async () => {
            if (cachedCategories) {
                setCategories(cachedCategories);
                setIsLoading(false);
                return;
            }

            if (!categoryFetchPromise) {
                categoryFetchPromise = fetch("/api/categories")
                    .then((res) => res.json())
                    .then((result) => {
                        if (result.success && result.data.categories) {
                            cachedCategories = result.data.categories;
                            return result.data.categories as Category[];
                        }
                        return [] as Category[];
                    })
                    .catch((err) => {
                        console.error("Error fetching categories:", err);
                        categoryFetchPromise = null;
                        return [] as Category[];
                    });
            }

            try {
                const cats = await categoryFetchPromise;
                if (isMounted) {
                    setCategories(cats);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchCategories();
        return () => {
            isMounted = false;
        };
    }, []);

    // When categories load or value is provided, sync mainCategoryId without mutating value
    useEffect(() => {
        if (categories.length > 0 && value) {
            const selectedCat = categories.find((c) => c.id === value);
            if (selectedCat) {
                if (selectedCat.parentId) {
                    setMainCategoryId(selectedCat.parentId);
                } else {
                    setMainCategoryId(selectedCat.id);
                }
            }
        }
    }, [categories, value]);

    const handleMainCategoryChange = useCallback((newMainId: string) => {
        setMainCategoryId(newMainId);
        const subCats = categories.filter((c) => c.parentId === newMainId);
        if (subCats.length === 0) {
            // Main category has no subcategories: select it directly
            onValueChange(newMainId);
        } else {
            // Check if current value is already a subcategory of this main category
            const isCurrentSub = subCats.some((c) => c.id === value);
            if (!isCurrentSub) {
                // Auto-select first subcategory so category is always valid and not blank
                onValueChange(subCats[0].id);
            }
        }
    }, [categories, value, onValueChange]);

    const mainCategories = categories.filter((c) => !c.parentId);
    const subCategories = categories.filter((c) => c.parentId === mainCategoryId);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Select disabled>
                    <SelectTrigger>
                        <SelectValue placeholder="Loading categories..." />
                    </SelectTrigger>
                </Select>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Category Selector */}
            <Select
                value={mainCategoryId || undefined}
                onValueChange={handleMainCategoryChange}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select Main Category" />
                </SelectTrigger>
                <SelectContent>
                    {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sub Category Selector */}
            {subCategories.length > 0 && (
                <Select
                    value={value || undefined}
                    onValueChange={(val) => {
                        if (val) onValueChange(val);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {subCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
