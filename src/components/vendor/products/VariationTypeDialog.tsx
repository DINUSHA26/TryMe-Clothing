"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Image as ImageIcon, Check } from "lucide-react";
import Image from "next/image";

export interface VariationType {
  name: string;
  options: string[];
  mapping?: Record<string, string>; // { "Red": "url..." }
}

const PREDEFINED_TYPES = ["Color", "Size", "Material", "Style", "Pattern"];

interface VariationTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (type: VariationType) => void;
  onDelete?: () => void;
  initialType?: VariationType;
  title?: string;
  productImages?: { url: string; altText?: string }[];
}

export function VariationTypeDialog({
  open,
  onClose,
  onSave,
  onDelete,
  initialType,
  title = "Custom variation",
  productImages,
}: VariationTypeDialogProps) {
  const [name, setName] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>(initialType?.mapping ?? {});
  const [optionInput, setOptionInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialType?.name ?? "");
      setOptions(initialType?.options ?? []);
      setMapping(initialType?.mapping ?? {});
      setOptionInput("");
      setNameError("");
      setOptionsError("");
    }
  }, [open, initialType]);

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setOptionInput("");
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setOptionInput("");
    setOptionsError("");
    inputRef.current?.focus();
  };

  const removeOption = (opt: string) => {
    setOptions((prev) => prev.filter((o) => o !== opt));
    const nextMapping = { ...mapping };
    delete nextMapping[opt];
    setMapping(nextMapping);
  };

  const updateMapping = (opt: string, url: string | undefined) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (!url) delete next[opt];
      else next[opt] = url;
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption();
    }
  };

  const handleSave = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else {
      setNameError("");
    }
    if (options.length === 0) {
      setOptionsError("Add at least 1 option");
      valid = false;
    } else {
      setOptionsError("");
    }
    if (!valid) return;
    onSave({ name: name.trim(), options, mapping });
    onClose();
  };

  const isColor = name.toLowerCase() === "color";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isColor
              ? "Define color options and map each to a specific product image (recommended)."
              : "Choose a variation name and add the available options buyers can select."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Predefined type chips */}
          <div>
            <Label className="mb-2 block">Name *</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDEFINED_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setName(t);
                    setNameError("");
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${name === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent border-border"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or create your own…"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-xs text-destructive mt-1">{nameError}</p>
            )}
          </div>

          {/* Options with mapping support */}
          <div>
            <Label className="mb-1 block">
              Options{" "}
              <span className="text-muted-foreground font-normal">
                ({options.length})
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-4">
              Add options below. {isColor && "Click the image icon to map a product photo to a specific color."}
            </p>

            {/* Existing option chips/list */}
            {options.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {options.map((opt) => (
                  <div key={opt} className="flex items-center justify-between border rounded-md p-2 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {isColor && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8 rounded-full overflow-hidden relative border-dashed p-0 shadow-sm"
                            >
                              {mapping[opt] ? (
                                <Image
                                  src={mapping[opt]}
                                  alt={opt}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start">
                            <div className="grid grid-cols-4 gap-2 p-1">
                              <Button
                                variant={!mapping[opt] ? "secondary" : "ghost"}
                                className="w-full aspect-square p-0 flex flex-col items-center justify-center text-[10px]"
                                onClick={() => updateMapping(opt, undefined)}
                              >
                                None
                              </Button>
                              {productImages?.map((img) => (
                                <Button
                                  key={img.url}
                                  variant={mapping[opt] === img.url ? "secondary" : "ghost"}
                                  className="w-full aspect-square p-0 relative overflow-hidden transition-all hover:scale-105"
                                  onClick={() => updateMapping(opt, img.url)}
                                >
                                  <Image
                                    src={img.url}
                                    alt={img.altText || "Product"}
                                    fill
                                    className="object-cover"
                                  />
                                  {mapping[opt] === img.url && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <Check className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(opt)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Option input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={isColor ? "e.g. Red, Blue, Black…" : "Enter an option…"}
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={optionsError ? "border-destructive ring-destructive/10" : "focus:ring-primary/10"}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={!optionInput.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {optionsError && (
              <p className="text-xs text-destructive mt-1 font-medium">{optionsError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive mr-auto"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Delete variation
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
