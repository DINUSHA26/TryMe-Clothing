"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Check } from "lucide-react";
import Image from "next/image";

export interface CombinationRow {
  values: Record<string, string>; // { Size: "L", Color: "Black" }
  price?: number;                 // absolute price; undefined = use basePrice
  stock: number;
  sku?: string;
  image?: string;
  visible: boolean;
}

interface CombinationTableProps {
  combinations: CombinationRow[];
  typeNames: string[];
  pricesVary: boolean;
  quantitiesVary: boolean;
  skusVary: boolean;
  basePrice: number;
  productImages: { url: string; altText?: string; position: number }[];
  onChange: (combinations: CombinationRow[]) => void;
}

export function CombinationTable({
  combinations,
  typeNames,
  pricesVary,
  quantitiesVary,
  skusVary,
  basePrice,
  productImages,
  onChange,
}: CombinationTableProps) {
  const update = (index: number, patch: Partial<CombinationRow>) => {
    onChange(combinations.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateAll = (patch: Partial<CombinationRow>) => {
    onChange(combinations.map((c) => ({ ...c, ...patch })));
  };

  const sharedPrice =
    combinations[0]?.price !== undefined ? combinations[0].price : basePrice;
  const sharedStock = combinations[0]?.stock ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {!pricesVary && (
          <div className="flex-1 min-w-[160px]">
            <Label className="mb-1 block text-sm">
              Price (Rs.) — all variants
            </Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={sharedPrice}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || basePrice;
                updateAll({ price: v });
              }}
            />
          </div>
        )}
        {!quantitiesVary && (
          <div className="flex-1 min-w-[140px]">
            <Label className="mb-1 block text-sm">
              Quantity — all variants
            </Label>
            <Input
              type="number"
              min="0"
              value={sharedStock}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0;
                updateAll({ stock: v });
              }}
            />
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium w-16">Image</th>
                {typeNames.map((t) => (
                  <th key={t} className="text-left px-3 py-2 font-medium">
                    {t}
                  </th>
                ))}
                {pricesVary && (
                  <th className="text-left px-3 py-2 font-medium">
                    Price (Rs.)
                  </th>
                )}
                {quantitiesVary && (
                  <th className="text-left px-3 py-2 font-medium">Quantity</th>
                )}
                {skusVary && (
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                )}
                <th className="text-left px-3 py-2 font-medium">Visible</th>
              </tr>
            </thead>
            <tbody>
              {combinations.map((combo, index) => (
                <tr
                  key={index}
                  className={`border-t ${!combo.visible ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 p-0 overflow-hidden relative border-dashed"
                        >
                          {combo.image ? (
                            <Image
                              src={combo.image}
                              alt="Variant"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            variant={!combo.image ? "secondary" : "ghost"}
                            className="w-full aspect-square p-0 flex flex-col items-center justify-center text-[10px]"
                            onClick={() => update(index, { image: undefined })}
                          >
                            None
                          </Button>
                          {productImages.map((img) => (
                            <Button
                              key={img.url}
                              variant={combo.image === img.url ? "secondary" : "ghost"}
                              className="w-full aspect-square p-0 relative overflow-hidden transition-all hover:scale-105"
                              onClick={() => update(index, { image: img.url })}
                            >
                              <Image
                                src={img.url}
                                alt={img.altText || "Product"}
                                fill
                                className="object-cover"
                              />
                              {combo.image === img.url && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>

                  {typeNames.map((t) => (
                    <td key={t} className="px-3 py-2 font-medium">
                      {combo.values[t]}
                    </td>
                  ))}

                  {pricesVary && (
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-28"
                        value={combo.price !== undefined ? combo.price : basePrice}
                        onChange={(e) =>
                          update(index, {
                            price: parseFloat(e.target.value) || basePrice,
                          })
                        }
                      />
                    </td>
                  )}

                  {quantitiesVary && (
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        className="w-24"
                        value={combo.stock}
                        onChange={(e) =>
                          update(index, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                  )}

                  {skusVary && (
                    <td className="px-3 py-2">
                      <Input
                        className="w-32"
                        placeholder="Optional"
                        value={combo.sku ?? ""}
                        onChange={(e) =>
                          update(index, { sku: e.target.value })
                        }
                      />
                    </td>
                  )}

                  <td className="px-3 py-2">
                    <Switch
                      checked={combo.visible}
                      onCheckedChange={(v) => update(index, { visible: v })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {combinations.length} variant{combinations.length !== 1 ? "s" : ""} ·
        Each tracks stock independently.
      </p>
    </div>
  );
}
