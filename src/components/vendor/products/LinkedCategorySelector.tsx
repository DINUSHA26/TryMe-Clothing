"use client";

import { useEffect, useState } from "react";
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

export function LinkedCategorySelector({ value, onValueChange }: LinkedCategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [mainCategoryId, setMainCategoryId] = useState<string>("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories?pageSize=100");
                const result = await response.json();
                if (result.success && result.data.categories) {
                    setCategories(result.data.categories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // When categories load, if we have a value (selected subcategory), figure out its main category
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
                onValueChange={(val) => {
                    setMainCategoryId(val);
                    // Auto-select if no subcategories? The prompt implies choosing a main category populates the subcategory menu.
                    // Reset the actual category value until a subcategory is selected, OR if the main category has no subcategories, select it.
                    const subCats = categories.filter((c) => c.parentId === val);
                    if (subCats.length === 0) {
                        onValueChange(val); // Select main category directly if no subcategories exist
                    } else {
                        onValueChange(""); // Force user to pick a subcategory
                    }
                }}
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
                    value={value === mainCategoryId ? "" : value} // don't highlight subcategory if it's main
                    onValueChange={(val) => {
                        onValueChange(val);
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
