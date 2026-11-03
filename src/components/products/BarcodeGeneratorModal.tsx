"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  Printer,
  Download,
  Barcode as BarcodeIcon,
  X,
  Layers,
  Settings2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface BarcodeItem {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock?: number;
  variantName?: string | null;
  storeName?: string | null;
}

interface BarcodeGeneratorModalProps {
  product: {
    id: string;
    name: string;
    sku?: string | null;
    price: number | string;
    stock?: number;
    variants?: Array<{
      id: string;
      name?: string;
      value?: string;
      sku?: string | null;
      stock?: number;
      priceAdjustment?: number | string | null;
    }>;
  };
  storeName?: string;
  triggerButton?: React.ReactNode;
}

export function BarcodeGeneratorModal({
  product,
  storeName = "TryMe Store",
  triggerButton,
}: BarcodeGeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("main");
  const [labelFormat, setLabelFormat] = useState<"thermal-50x25" | "thermal-40x30" | "a4-24" | "a4-40">("thermal-50x25");
  const [printCount, setPrintCount] = useState<number>(1);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showVariant, setShowVariant] = useState(true);

  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Determine active item
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant = hasVariants && selectedVariantId !== "main"
    ? product.variants?.find((v) => v.id === selectedVariantId)
    : null;

  const currentPrice = selectedVariant
    ? Number(product.price) + Number(selectedVariant.priceAdjustment || 0)
    : Number(product.price);

  const rawCode = selectedVariant?.sku || product.sku;
  const barcodeValue = rawCode && rawCode.trim().length > 0
    ? rawCode.trim()
    : selectedVariant
    ? `VAR-${selectedVariant.id.slice(-6).toUpperCase()}`
    : `PRD-${product.id.slice(-6).toUpperCase()}`;

  const variantLabel = selectedVariant
    ? `${selectedVariant.name || "Variant"}: ${selectedVariant.value}`
    : null;

  // Render barcode whenever target changes
  useEffect(() => {
    if (!isOpen || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",
        width: 1.8,
        height: 48,
        displayValue: true,
        fontSize: 12,
        font: "monospace",
        textMargin: 3,
        margin: 5,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (e) {
      console.error("Barcode render error:", e);
    }
  }, [isOpen, barcodeValue, selectedVariantId]);

  // Set default print count based on item's stock
  useEffect(() => {
    if (selectedVariant?.stock !== undefined) {
      setPrintCount(Math.max(1, selectedVariant.stock));
    } else if (product.stock !== undefined) {
      setPrintCount(Math.max(1, product.stock));
    }
  }, [selectedVariantId, product.stock, selectedVariant?.stock]);

  const handlePrint = () => {
    window.print();
  };

  const downloadBarcodeSvg = () => {
    if (!barcodeRef.current) return;
    const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Barcode-${barcodeValue}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Label items to repeat for printing
  const printItems = Array.from({ length: Math.min(100, Math.max(1, printCount)) });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton ? (
            triggerButton
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold gap-1.5 border-slate-300 hover:bg-slate-100"
            >
              <BarcodeIcon className="w-3.5 h-3.5 text-primary" />
              <span>Barcode &amp; Labels</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-2xl">
          {/* Header */}
          <div className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-gray-900 text-white rounded-t-xl shadow-md">
            <div className="flex items-center gap-2">
              <BarcodeIcon className="w-5 h-5 text-indigo-400" />
              <DialogTitle className="text-base font-bold text-white">
                Barcode &amp; Sticker Label Generator
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Labels
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>

          <div className="p-6 bg-card text-foreground space-y-6">
            {/* Top Control Bar: Variant Selection & Label Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
              {/* Variant Selector */}
              {hasVariants && (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Select Product Variant
                  </Label>
                  <Select
                    value={selectedVariantId}
                    onValueChange={setSelectedVariantId}
                  >
                    <SelectTrigger className="w-full bg-background font-semibold">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">
                        Default / Base Product ({product.sku || "Base SKU"})
                      </SelectItem>
                      {product.variants?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name || "Variant"}: {v.value}{" "}
                          {v.sku ? `(SKU: ${v.sku})` : ""} - Stock: {v.stock ?? 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Label Size / Printer Layout */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-primary" />
                  Sticker Label Format
                </Label>
                <Select
                  value={labelFormat}
                  onValueChange={(val: any) => setLabelFormat(val)}
                >
                  <SelectTrigger className="w-full bg-background font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal-50x25">
                      Thermal Label 50 x 25 mm (Standard Roll)
                    </SelectItem>
                    <SelectItem value="thermal-40x30">
                      Thermal Label 40 x 30 mm (Compact)
                    </SelectItem>
                    <SelectItem value="a4-24">
                      A4 Sheet - 24 Labels per page (3x8)
                    </SelectItem>
                    <SelectItem value="a4-40">
                      A4 Sheet - 40 Labels per page (4x10)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Print Quantity */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                  Quantity of Stickers to Print
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintCount(Math.max(1, printCount - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={printCount}
                    onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintCount(printCount + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Toggle Label Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Switch checked={showStoreName} onCheckedChange={setShowStoreName} />
                  <span>Store Name</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Switch checked={showTitle} onCheckedChange={setShowTitle} />
                  <span>Title</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Switch checked={showVariant} onCheckedChange={setShowVariant} />
                  <span>Variant</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Switch checked={showPrice} onCheckedChange={setShowPrice} />
                  <span>Price</span>
                </label>
              </div>
            </div>

            {/* Live Label Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border rounded-2xl shadow-inner">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Single Label Live Preview
              </p>

              {/* The Styled Label Card */}
              <div
                className="w-[260px] p-4 bg-white text-gray-900 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center text-center shadow-md select-none"
              >
                {showStoreName && (
                  <p className="text-[11px] font-black uppercase text-indigo-700 tracking-wider mb-0.5 truncate w-full">
                    {storeName}
                  </p>
                )}

                {showTitle && (
                  <p className="text-xs font-bold text-gray-900 line-clamp-1 w-full leading-tight">
                    {product.name}
                  </p>
                )}

                {showVariant && variantLabel && (
                  <p className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded mt-0.5">
                    {variantLabel}
                  </p>
                )}

                {/* Barcode SVG */}
                <div className="my-1 w-full flex justify-center">
                  <svg ref={barcodeRef} className="max-w-full h-auto" />
                </div>

                {showPrice && (
                  <p className="text-sm font-black text-gray-900 mt-0.5">
                    Rs.{" "}
                    {currentPrice.toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>

              {/* Download Barcode SVG option */}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadBarcodeSvg}
                  className="text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download Barcode (SVG)
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Container: Styled for Paper / Thermal Print */}
      <div id="printable-barcode-sheet" className="hidden print:block">
        <div
          className={
            labelFormat === "thermal-50x25"
              ? "thermal-50x25-container"
              : labelFormat === "thermal-40x30"
              ? "thermal-40x30-container"
              : labelFormat === "a4-24"
              ? "a4-24-container"
              : "a4-40-container"
          }
        >
          {printItems.map((_, idx) => (
            <div key={idx} className="barcode-sticker-label">
              {showStoreName && <div className="lbl-store">{storeName}</div>}
              {showTitle && <div className="lbl-title">{product.name}</div>}
              {showVariant && variantLabel && (
                <div className="lbl-variant">{variantLabel}</div>
              )}
              <svg
                ref={(el) => {
                  if (el) {
                    try {
                      JsBarcode(el, barcodeValue, {
                        format: "CODE128",
                        width: labelFormat.startsWith("thermal") ? 1.5 : 1.3,
                        height: labelFormat.startsWith("thermal") ? 32 : 28,
                        displayValue: true,
                        fontSize: 9,
                        font: "monospace",
                        textMargin: 1,
                        margin: 2,
                      });
                    } catch (e) {
                      /* ignore */
                    }
                  }
                }}
              />
              {showPrice && (
                <div className="lbl-price">
                  Rs.{" "}
                  {currentPrice.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            visibility: hidden !important;
            background: #fff !important;
          }
          #printable-barcode-sheet,
          #printable-barcode-sheet * {
            visibility: visible !important;
          }
          #printable-barcode-sheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            z-index: 9999999 !important;
          }
          .thermal-50x25-container,
          .thermal-40x30-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .thermal-50x25-container .barcode-sticker-label {
            width: 50mm;
            height: 25mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1mm;
            box-sizing: border-box;
          }
          .thermal-40x30-container .barcode-sticker-label {
            width: 40mm;
            height: 30mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1mm;
            box-sizing: border-box;
          }
          .a4-24-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2mm;
            padding: 8mm;
            box-sizing: border-box;
            width: 210mm;
          }
          .a4-24-container .barcode-sticker-label {
            border: 1px dashed #ccc;
            height: 33mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1.5mm;
            box-sizing: border-box;
          }
          .a4-40-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5mm;
            padding: 6mm;
            box-sizing: border-box;
            width: 210mm;
          }
          .a4-40-container .barcode-sticker-label {
            border: 1px dashed #ccc;
            height: 27mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1mm;
            box-sizing: border-box;
          }
          .lbl-store {
            font-size: 7pt;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1;
          }
          .lbl-title {
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1.1;
            max-width: 95%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .lbl-variant {
            font-size: 6.5pt;
            font-weight: 600;
            line-height: 1;
            color: #333;
          }
          .lbl-price {
            font-size: 8pt;
            font-weight: 800;
            line-height: 1.1;
          }
        }
      `}</style>
    </>
  );
}
