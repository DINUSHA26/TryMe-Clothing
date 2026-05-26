"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProductSortProps {
    value: string;
    onValueChange: (value: string) => void;
}

const SORT_OPTIONS = [
    { value: "featured", label: "Featured" },
    { value: "best-selling", label: "Best selling" },
    { value: "alphabetical-asc", label: "Alphabetically, A-Z" },
    { value: "alphabetical-desc", label: "Alphabetically, Z-A" },
    { value: "price-asc", label: "Price, low to high" },
    { value: "price-desc", label: "Price, high to low" },
    { value: "date-asc", label: "Date, old to new" },
    { value: "date-desc", label: "Date, new to old" },
];

export function ProductSort({ value, onValueChange }: ProductSortProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-widest text-[#1a1a1a] dark:text-gray-300 uppercase whitespace-nowrap">
                SORT BY
            </span>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="w-[200px] h-[45px] rounded-none border-gray-300 dark:border-gray-700 focus:ring-0 focus:ring-offset-0 bg-white dark:bg-slate-950 text-[#1a1a1a] dark:text-gray-100 text-[13px]">
                    <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950">
                    {SORT_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-[13px] py-2.5 focus:bg-gray-100 dark:focus:bg-slate-800 cursor-pointer text-[#1a1a1a] dark:text-gray-200"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
