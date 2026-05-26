"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Ruler, FileText, ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ProductVariant {
    id: string;
    name: string;
    value: string;
    priceAdjustment: number | null;
    stock: number;
    sku?: string | null;
    image?: string | null;
}

interface VariantSwatchesProps {
    variants: ProductVariant[];
    selectedVariantId: string | null;
    onSelect: (variantId: string | null) => void;
    onSelectionChange?: (selections: Record<string, string>, image: string | null) => void;
    sizeChart?: string | null;
}

export function VariantSwatches({
    variants,
    selectedVariantId,
    onSelect,
    onSelectionChange,
    sizeChart,
}: VariantSwatchesProps) {
    // 1. Identify attributes (e.g., ["Color", "Size"])
    const attributeNames = useMemo(() => {
        if (variants.length === 0) return [];
        return variants[0].name.split(" / ");
    }, [variants]);

    // 2. Extract options for each attribute (e.g., { Color: ["Red", "Blue"], Size: ["S", "M"] })
    const optionsByAttribute = useMemo(() => {
        const map: Record<string, string[]> = {};
        attributeNames.forEach((name) => (map[name] = []));

        variants.forEach((v) => {
            const values = v.value.split(" / ");
            attributeNames.forEach((name, i) => {
                if (!map[name].includes(values[i])) {
                    map[name].push(values[i]);
                }
            });
        });
        return map;
    }, [variants, attributeNames]);

    // 3. Current selection state for each attribute
    const [selections, setSelections] = useState<Record<string, string>>(() => {
        if (!selectedVariantId) return {};
        const selected = variants.find((v) => v.id === selectedVariantId);
        if (!selected) return {};

        const values = selected.value.split(" / ");
        const initial: Record<string, string> = {};
        attributeNames.forEach((name, i) => {
            initial[name] = values[i];
        });
        return initial;
    });

    // 4. Find the matching variant based on current selections
    const findMatchingVariant = (newSelections: Record<string, string>) => {
        const targetValue = attributeNames.map((name) => newSelections[name]).join(" / ");
        return variants.find((v) => v.value === targetValue) || null;
    };

    const handleSelect = (attrName: string, value: string) => {
        const nextSelections = { ...selections, [attrName]: value };
        setSelections(nextSelections);

        // Find if color is selected to maintain the color image when sizing is selected
        const colorAttr = attributeNames.find(a => a.toLowerCase() === "color");
        let activeImage = null;
        if (colorAttr && nextSelections[colorAttr]) {
            activeImage = getRepresentativeImage(colorAttr, nextSelections[colorAttr]);
        }
        onSelectionChange?.(nextSelections, activeImage);

        // If all attributes are selected, find the variant
        if (Object.keys(nextSelections).length === attributeNames.length) {
            const variant = findMatchingVariant(nextSelections);
            onSelect(variant?.id || null);
        } else {
            onSelect(null);
        }
    };

    // 5. Check if an option is available
    const isOptionAvailable = (attrName: string, value: string) => {
        return variants.some((v) => {
            const values = v.value.split(" / ");
            const index = attributeNames.indexOf(attrName);
            return values[index] === value && v.stock > 0;
        });
    };

    // 6. Find a representative image for a specific attribute value
    const getRepresentativeImage = (attrName: string, value: string) => {
        if (attrName.toLowerCase() === "color") {
            const variantWithImage = variants.find((v) => {
                const values = v.value.split(" / ");
                const index = attributeNames.indexOf(attrName);
                return values[index] === value && v.image;
            });
            return variantWithImage?.image || null;
        }
        return null;
    };

    // 7. Get Color Hex for fallback swatches
    const getColorHex = (value: string) => {
        const colors: Record<string, string> = {
            black: "#000000",
            white: "#FFFFFF",
            red: "#EF4444",
            blue: "#3B82F6",
            green: "#22C55E",
            yellow: "#EAB308",
            purple: "#A855F7",
            pink: "#EC4899",
            orange: "#F97316",
            gray: "#6B7280",
            grey: "#6B7280",
            brown: "#78350F",
            navy: "#1E3A8A",
            beige: "#F5F5DC",
            cream: "#FFFDD0",
            maroon: "#800000",
            teal: "#008080",
            cyan: "#00FFFF",
            lavender: "#E6E6FA",
            olive: "#808000",
            tan: "#D2B48C",
            peach: "#FFDAB9",
            mint: "#98FF98",
            gold: "#FFD700",
            silver: "#C0C0C0",
            emerald: "#50C878",
            burgundy: "#800020",
            khaki: "#F0E68C",
            lilac: "#C8A2C8",
            mustard: "#FFDB58",
            coral: "#FF7F50",
            indigo: "#4B0082",
            rust: "#B7410E"
        };
        return colors[value.toLowerCase()] || null;
    };

    return (
        <div className="space-y-6">
            {attributeNames.map((attrName) => {
                const isColor = attrName.toLowerCase() === "color";

                return (
                    <div key={attrName} className="space-y-3">
                        <div className="flex items-center justify-between w-full">
                            <label className="text-sm font-semibold tracking-tight text-foreground">
                                {attrName}: <span className="text-muted-foreground ml-1 font-medium capitalize">{selections[attrName] || "Choose One"}</span>
                            </label>
                            {attrName.toLowerCase() === "size" && sizeChart && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors border border-muted-foreground/20 rounded-md px-2.5 py-1 bg-card hover:bg-accent/30 shadow-xs"
                                        >
                                            <Ruler className="h-3.5 w-3.5" />
                                            Size Guide
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                                <Ruler className="h-5 w-5 text-primary" />
                                                Size Guide
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 flex flex-col items-center justify-center">
                                            <div className="relative w-full aspect-[4/3] max-h-[60vh] border rounded-lg overflow-hidden bg-muted/20">
                                                <img
                                                    src={sizeChart}
                                                    alt="Size Guide"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {optionsByAttribute[attrName].map((value) => {
                                const isSelected = selections[attrName] === value;
                                const isAvailable = isOptionAvailable(attrName, value);
                                const image = getRepresentativeImage(attrName, value);
                                const colorHex = isColor ? getColorHex(value) : null;

                                if (isColor) {
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => handleSelect(attrName, value)}
                                            className={cn(
                                                "group relative flex items-center justify-center transition-all duration-300 transform",
                                                !isAvailable && "opacity-40 grayscale-[0.5]"
                                            )}
                                        >
                                            {/* Outer Ring */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full border-2 p-0.5 transition-all duration-300",
                                                isSelected
                                                    ? "border-foreground scale-110 shadow-md"
                                                    : "border-transparent group-hover:border-foreground/30"
                                            )}>
                                                {/* Swatch Content */}
                                                <div
                                                    className="w-full h-full rounded-full overflow-hidden border border-black/5 relative"
                                                    style={{ backgroundColor: colorHex || "transparent" }}
                                                >
                                                    {image ? (
                                                        <Image
                                                            src={image}
                                                            alt={value}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : !colorHex ? (
                                                        <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] font-bold">
                                                            ?
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Out of stock line */}
                                            {!isAvailable && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-8 h-[1.5px] bg-foreground/50 -rotate-45" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleSelect(attrName, value)}
                                        className={cn(
                                            "min-w-[52px] h-11 px-4 border text-sm font-medium transition-all duration-200",
                                            isSelected
                                                ? "border-foreground bg-foreground text-background shadow-sm"
                                                : "border-muted-foreground/30 hover:border-foreground",
                                            !isAvailable && "opacity-30 cursor-not-allowed"
                                        )}
                                        disabled={!isAvailable}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
