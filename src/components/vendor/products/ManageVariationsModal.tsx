"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { VariationTypeDialog, type VariationType } from "./VariationTypeDialog";

export interface VariationSettings {
  types: VariationType[];
  pricesVary: boolean;
  quantitiesVary: boolean;
  skusVary: boolean;
}

interface ManageVariationsModalProps {
  open: boolean;
  onClose: () => void;
  initialSettings: VariationSettings;
  onApply: (settings: VariationSettings) => void;
  productImages?: { url: string; altText?: string }[];
}

export function ManageVariationsModal({
  open,
  onClose,
  initialSettings,
  onApply,
  productImages,
}: ManageVariationsModalProps) {
  const [types, setTypes] = useState<VariationType[]>(initialSettings.types);
  const [pricesVary, setPricesVary] = useState(initialSettings.pricesVary);
  const [quantitiesVary, setQuantitiesVary] = useState(
    initialSettings.quantitiesVary
  );
  const [skusVary, setSkusVary] = useState(initialSettings.skusVary);

  // Type dialog state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);

  // Reset state when modal opens with new settings
  const handleOpen = () => {
    setTypes(initialSettings.types);
    setPricesVary(initialSettings.pricesVary);
    setQuantitiesVary(initialSettings.quantitiesVary);
    setSkusVary(initialSettings.skusVary);
  };

  const combinationCount =
    types.length === 0
      ? 0
      : types.reduce((acc, t) => acc * t.options.length, 1);

  const openAddType = () => {
    setEditingTypeIndex(null);
    setTypeDialogOpen(true);
  };

  const openEditType = (index: number) => {
    setEditingTypeIndex(index);
    setTypeDialogOpen(true);
  };

  const handleSaveType = (type: VariationType) => {
    if (editingTypeIndex !== null) {
      setTypes((prev) =>
        prev.map((t, i) => (i === editingTypeIndex ? type : t))
      );
    } else {
      setTypes((prev) => [...prev, type]);
    }
    setTypeDialogOpen(false);
    setEditingTypeIndex(null);
  };

  const handleDeleteType = (index: number) => {
    setTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApply({ types, pricesVary, quantitiesVary, skusVary });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) handleOpen();
          else onClose();
        }}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage variations</DialogTitle>
            <DialogDescription>
              Define variation types and configure how prices, quantities, and SKUs are set per combination.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Variation type cards */}
            <div className="space-y-3">
              {types.map((type, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card shadow-sm">
                  <div className="flex items-start justify-between mb-3 border-b pb-2">
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {type.name}
                        {type.mapping && Object.keys(type.mapping).length > 0 && (
                          <ImageIcon className="h-3.5 w-3.5 text-primary opacity-70" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type.options.length} option
                        {type.options.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditType(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteType(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {type.options.map((opt) => {
                      const mappedImage = type.mapping?.[opt];
                      return (
                        <div key={opt} className="relative group">
                          <Badge variant="secondary" className={`pl-1 flex items-center gap-1.5 transition-all text-xs font-medium py-1 px-2 ${mappedImage ? 'bg-primary/5 text-primary border-primary/20' : ''}`}>
                            {mappedImage && (
                              <div className="relative w-4 h-4 rounded-full overflow-hidden border border-primary/20">
                                <Image src={mappedImage} alt={opt} fill className="object-cover" />
                              </div>
                            )}
                            {opt}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add a variation button */}
            {types.length < 3 && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 dashed border-dashed bg-muted/20 hover:bg-muted/40 transition-colors"
                onClick={openAddType}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add variant type (e.g. Color, Size)
              </Button>
            )}

            {types.length > 0 && <hr className="my-4" />}

            {/* Toggles */}
            {types.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Label htmlFor="prices-vary" className="cursor-pointer">
                    <span className="font-semibold block">Prices vary</span>
                    <span className="text-xs text-muted-foreground">Each combination can have a unique price</span>
                  </Label>
                  <Switch
                    id="prices-vary"
                    checked={pricesVary}
                    onCheckedChange={setPricesVary}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Label htmlFor="qty-vary" className="cursor-pointer">
                    <span className="font-semibold block">Quantities vary</span>
                    <span className="text-xs text-muted-foreground">Track separate stock for each variation</span>
                  </Label>
                  <Switch
                    id="qty-vary"
                    checked={quantitiesVary}
                    onCheckedChange={setQuantitiesVary}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Label htmlFor="skus-vary" className="cursor-pointer">
                    <span className="font-semibold block">SKUs vary</span>
                    <span className="text-xs text-muted-foreground">Assign unique SKUs for internal tracking</span>
                  </Label>
                  <Switch
                    id="skus-vary"
                    checked={skusVary}
                    onCheckedChange={setSkusVary}
                  />
                </div>
              </div>
            )}

            {/* Info */}
            {combinationCount > 0 && (
              <div className="bg-primary/5 rounded-lg p-4 text-sm text-primary flex items-center gap-3 border border-primary/10">
                <div className="bg-primary/10 p-2 rounded-full font-black text-xs">{combinationCount}</div>
                <div className="font-medium">
                  {combinationCount} unique product combination
                  {combinationCount !== 1 ? "s" : ""} will be generated.
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={types.length === 0}
              className="px-8 shadow-md"
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested type dialog */}
      <VariationTypeDialog
        open={typeDialogOpen}
        onClose={() => {
          setTypeDialogOpen(false);
          setEditingTypeIndex(null);
        }}
        onSave={handleSaveType}
        productImages={productImages}
        onDelete={
          editingTypeIndex !== null
            ? () => handleDeleteType(editingTypeIndex)
            : undefined
        }
        initialType={
          editingTypeIndex !== null ? types[editingTypeIndex] : undefined
        }
        title={editingTypeIndex !== null ? "Edit variation" : "Add variation"}
      />
    </>
  );
}
