"use client";

import { useState, useEffect } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManageVariationsModal, type VariationSettings } from "./ManageVariationsModal";
import { CombinationTable, type CombinationRow } from "./CombinationTable";
import { type VariationType } from "./VariationTypeDialog";

// Public interface for parent (ProductForm)
export interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  priceAdjustment?: number;
  stock: number;
  sku?: string;
  image?: string;
}

export interface VariantSettingsInfo {
  hasVariants: boolean;
  pricesVary: boolean;
  quantitiesVary: boolean;
  typeNames: string[];
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
  productImages: { url: string; altText?: string; position: number }[];
  onSettingsChange?: (settings: VariantSettingsInfo) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Generate all combinations (cross-product) for variation types, applying image mappings. */
function generateCombinations(types: VariationType[]): CombinationRow[] {
  if (types.length === 0) return [];

  // Generic n-way cross product
  return types.reduce<any[]>((acc, type) => {
    if (acc.length === 0) {
      return type.options.map(opt => ({
        values: { [type.name]: opt },
        stock: 0,
        visible: true,
        image: type.mapping?.[opt] // Apply initial mapping
      }));
    }
    return acc.flatMap(prev => type.options.map(opt => {
      const image = type.mapping?.[opt] || prev.image;
      return {
        ...prev,
        values: { ...prev.values, [type.name]: opt },
        image: image // Cascade image (e.g. Color image takes precedence or fills empty)
      };
    }));
  }, []) as CombinationRow[];
}

/**
 * Merge newly generated combinations with existing ones so that
 * previously entered price/stock/sku values are preserved for
 * combinations that still exist.
 */
function mergeCombinations(
  newCombos: CombinationRow[],
  existing: CombinationRow[]
): CombinationRow[] {
  return newCombos.map((nc) => {
    const key = JSON.stringify(nc.values);
    const found = existing.find((e) => JSON.stringify(e.values) === key);
    return found ? {
      ...nc,
      price: found.price,
      stock: found.stock,
      sku: found.sku,
      image: found.image,
      visible: found.visible
    } : nc;
  });
}

/**
 * Reconstruct types + combinations from saved ProductVariant[].
 * Stored format: name = "Size" | "Size / Color", value = "L" | "L / Black"
 */
function parseVariants(
  variants: ProductVariant[],
  basePrice: number
): { types: VariationType[]; combinations: CombinationRow[] } {
  if (variants.length === 0) return { types: [], combinations: [] };

  const firstNames = variants[0].name.split(" / ");

  // Rebuild types from unique values
  const optionSets: Record<string, Set<string>> = {};
  firstNames.forEach((n) => (optionSets[n] = new Set()));

  for (const v of variants) {
    const nameParts = v.name.split(" / ");
    const valueParts = v.value.split(" / ");
    nameParts.forEach((n, i) => {
      if (!optionSets[n]) optionSets[n] = new Set();
      optionSets[n].add(valueParts[i] ?? "");
    });
  }

  const types: VariationType[] = firstNames.map((n) => ({
    name: n,
    options: Array.from(optionSets[n] ?? []),
  }));

  // Rebuild combination rows
  const combinations: CombinationRow[] = variants.map((v) => {
    const nameParts = v.name.split(" / ");
    const valueParts = v.value.split(" / ");
    const values: Record<string, string> = {};
    nameParts.forEach((n, i) => {
      values[n] = valueParts[i] ?? "";
    });
    const absolutePrice = basePrice + (v.priceAdjustment ?? 0);
    return {
      values,
      price: absolutePrice,
      stock: v.stock,
      sku: v.sku ?? undefined,
      image: v.image,
      visible: true,
    };
  });

  return { types, combinations };
}

/** Convert internal combinations back to ProductVariant[] for the parent form. */
function toProductVariants(
  combinations: CombinationRow[],
  typeNames: string[],
  basePrice: number
): ProductVariant[] {
  return combinations
    .filter((c) => c.visible)
    .map((c) => ({
      name: typeNames.join(" / "),
      value: typeNames.map((t) => c.values[t]).join(" / "),
      priceAdjustment: (c.price !== undefined ? c.price : basePrice) - basePrice,
      stock: c.stock,
      sku: c.sku ?? "",
      image: c.image,
    }));
}

// ─── component ──────────────────────────────────────────────────────────────

export function VariantManager({
  variants,
  onChange,
  basePrice,
  productImages,
  onSettingsChange,
}: VariantManagerProps) {
  // Parse existing saved variants on first render
  const [initialParsed] = useState(() => parseVariants(variants, basePrice));

  const [types, setTypes] = useState<VariationType[]>(initialParsed.types);
  const [combinations, setCombinations] = useState<CombinationRow[]>(initialParsed.combinations);
  const [pricesVary, setPricesVary] = useState(variants.some(v => v.priceAdjustment !== 0));
  const [quantitiesVary, setQuantitiesVary] = useState(true);
  const [skusVary, setSkusVary] = useState(variants.some(v => !!v.sku));
  const [modalOpen, setModalOpen] = useState(false);

  const typeNames = types.map((t) => t.name);

  // Sync outward whenever combinations change
  useEffect(() => {
    if (types.length === 0) return;
    onChange(toProductVariants(combinations, typeNames, basePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations, basePrice, typeNames.join(",")]);

  // Notify parent of settings changes
  useEffect(() => {
    onSettingsChange?.({
      hasVariants: types.length > 0,
      pricesVary,
      quantitiesVary,
      typeNames,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, pricesVary, quantitiesVary]);

  const handleApply = (settings: VariationSettings) => {
    const newCombos = generateCombinations(settings.types);
    const merged = mergeCombinations(newCombos, combinations);
    setTypes(settings.types);
    setCombinations(merged);
    setPricesVary(settings.pricesVary);
    setQuantitiesVary(settings.quantitiesVary);
    setSkusVary(settings.skusVary);

    if (settings.types.length === 0) {
      onChange([]);
    }
    setModalOpen(false);
  };

  const handleClearVariations = () => {
    setTypes([]);
    setCombinations([]);
    onChange([]);
  };

  if (types.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Add variations like size, color, or other options (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add variations
          </Button>

          <ManageVariationsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            initialSettings={{ types: [], pricesVary: false, quantitiesVary: true, skusVary: false }}
            onApply={handleApply}
            productImages={productImages}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Product Variants</CardTitle>
            <CardDescription className="mt-1">
              {combinations.filter((c) => c.visible).length} active variant
              {combinations.filter((c) => c.visible).length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Manage variations
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleClearVariations}
            >
              Remove all
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {types.map((t) => (
            <div key={t.name} className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t.name}:
              </span>
              {t.options.map((opt) => (
                <Badge key={opt} variant="outline" className="text-xs">
                  {opt}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <CombinationTable
          combinations={combinations}
          typeNames={typeNames}
          pricesVary={pricesVary}
          quantitiesVary={quantitiesVary}
          skusVary={skusVary}
          basePrice={basePrice}
          productImages={productImages}
          onChange={setCombinations}
        />
      </CardContent>

      <ManageVariationsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSettings={{ types, pricesVary, quantitiesVary, skusVary }}
        onApply={handleApply}
        productImages={productImages}
      />
    </Card>
  );
}
