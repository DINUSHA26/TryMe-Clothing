"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Package } from "lucide-react";

interface SubCategory {
    id: string;
    name: string;
    slug: string;
    image: string | null;
}

interface SubCategoryBarProps {
    categories: SubCategory[];
    activeSlug?: string;
    parentSlug?: string;
    onSelect?: (slug: string) => void;
}

export function SubCategoryBar({ categories, activeSlug, parentSlug }: SubCategoryBarProps) {
    if (!categories || categories.length === 0) return null;

    // Add an "All" option if we are on a parent category
    const showAll = parentSlug && activeSlug === parentSlug;

    return (
        <div className="w-full bg-white dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-20 border-b mb-8">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-8 p-6 mx-auto">
                    {/* Virtual "All" option if provided */}
                    {parentSlug && (
                        <Link
                            href={`/categories/${parentSlug}`}
                            className={cn(
                                "group flex flex-col items-center gap-3 transition-all duration-300",
                                activeSlug === parentSlug ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"
                            )}
                        >
                            <div className={cn(
                                "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ring-4",
                                activeSlug === parentSlug
                                    ? "bg-primary text-white ring-primary/20 shadow-xl"
                                    : "bg-slate-100 dark:bg-slate-800 ring-transparent group-hover:ring-primary/10"
                            )}>
                                <Package className={cn("h-8 w-8", activeSlug === parentSlug ? "text-white" : "text-slate-400")} />
                            </div>
                            <span className={cn(
                                "text-[10px] sm:text-xs font-black uppercase tracking-widest text-center w-[70px] sm:w-[90px] leading-tight transition-colors whitespace-normal break-words line-clamp-2",
                                activeSlug === parentSlug ? "text-primary" : "text-slate-500 group-hover:text-primary"
                            )}>
                                All
                            </span>
                        </Link>
                    )}

                    {categories.map((sub) => (
                        <Link
                            key={sub.id}
                            href={`/categories/${sub.slug}`}
                            className={cn(
                                "group flex flex-col items-center gap-3 transition-all duration-300",
                                activeSlug === sub.slug ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"
                            )}
                        >
                            <div className={cn(
                                "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden transition-all duration-300 ring-4 shadow-sm",
                                activeSlug === sub.slug
                                    ? "ring-primary shadow-xl scale-110 z-10"
                                    : "ring-slate-100 dark:ring-slate-800 group-hover:ring-primary/20"
                            )}>
                                {sub.image ? (
                                    <Image
                                        src={sub.image}
                                        alt={sub.name}
                                        fill
                                        className={cn(
                                            "object-cover transition-transform duration-500",
                                            activeSlug === sub.slug ? "scale-110" : "group-hover:scale-110"
                                        )}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <Package className="h-6 w-6 text-slate-300" />
                                    </div>
                                )}
                                {/* Active Overlay */}
                                {activeSlug === sub.slug && (
                                    <div className="absolute inset-0 bg-primary/10" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] sm:text-xs font-black uppercase tracking-widest text-center w-[70px] sm:w-[90px] leading-tight transition-colors whitespace-normal break-words line-clamp-2 mt-1",
                                activeSlug === sub.slug ? "text-primary" : "text-slate-500 group-hover:text-primary"
                            )}>
                                {sub.name}
                            </span>
                        </Link>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    );
}
