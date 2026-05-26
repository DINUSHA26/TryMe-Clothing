"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategorySelectorItem } from "@/types/category";

interface CategorySelectorProps {
  value?: string;
  onValueChange: (value: string | null) => void;
  excludeId?: string; // Exclude specific category (for edit)
  placeholder?: string;
  allowRoot?: boolean; // Allow "No parent" option
  apiUrl?: string; // API endpoint to fetch categories from
  showAllLevels?: boolean; // Show all categories (not just root)
}

export function CategorySelector({
  value,
  onValueChange,
  excludeId,
  placeholder = "Select category",
  allowRoot = true,
  apiUrl = "/api/admin/categories?pageSize=100",
  showAllLevels = false,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategorySelectorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success) {
        // Build flat list with hierarchy indicators
        const items: CategorySelectorItem[] = result.data.categories
          .filter((cat: any) => cat.id !== excludeId) // Exclude specified category
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            parentId: cat.parentId,
            level: cat.parentId ? 1 : 0,
          }));

        // Sort: root categories first, then children
        items.sort((a, b) => {
          if (a.level === 0 && b.level === 0) {
            return a.name.localeCompare(b.name);
          }
          if (a.level === 0) return -1;
          if (b.level === 0) return 1;
          return a.name.localeCompare(b.name);
        });

        setCategories(items);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === "null") {
      onValueChange(null);
    } else {
      onValueChange(value);
    }
  };

  // Get parent category names for children
  const getDisplayName = (category: CategorySelectorItem) => {
    if (category.level === 0) {
      return category.name;
    }

    const parent = categories.find((c) => c.id === category.parentId);
    return parent ? `${parent.name} → ${category.name}` : category.name;
  };

  if (isLoading) {
    return (
      <Select disabled value="null">
        <SelectTrigger>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || "null"} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowRoot && (
          <SelectItem value="null">
            <span className="text-muted-foreground">No parent (Root)</span>
          </SelectItem>
        )}

        {categories
          .filter((cat) => showAllLevels || cat.level === 0)
          .map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {getDisplayName(category)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
