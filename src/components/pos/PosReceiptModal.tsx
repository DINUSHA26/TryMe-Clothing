"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { format } from "date-fns";
import { Printer, X, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PosReceiptData {
  orderNumber: string;
  items: Array<{
    name?: string;
    productSnapshot?: { name: string; sku?: string };
    variantSnapshot?: { name?: string; value: string; sku?: string } | null;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    itemDiscount?: number;
  }>;
  subtotal: number;
  totalDiscounts: number;
  grandTotal: number;
  paymentMethod: string;
  cashReceived?: number;
  changeDue?: number;
  createdAt?: string;
  customerInfo?: { fullName?: string; phone?: string };
  vendor?: {
    businessName: string;
    businessPhone?: string;
    businessEmail?: string;
    businessAddress?: string;
    logo?: string | null;
  };
}

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
  data: PosReceiptData | null;
}

export function PosReceiptModal({
  isOpen,
  onClose,
  onNewSale,
  data,
}: PosReceiptModalProps) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!isOpen || !data?.orderNumber || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, data.orderNumber, {
        format: "CODE128",
        width: 1.4,
        height: 36,
        displayValue: true,
        fontSize: 10,
        font: "monospace",
        textMargin: 2,
        margin: 2,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (e) {
      console.error("Receipt barcode render error:", e);
    }
  }, [isOpen, data?.orderNumber]);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = data.createdAt
    ? format(new Date(data.createdAt), "dd/MM/yyyy h:mm a")
    : format(new Date(), "dd/MM/yyyy h:mm a");

  const storeName = data.vendor?.businessName || "TryMe Retail Store";
  const storePhone = data.vendor?.businessPhone || "";
  const storeAddress = data.vendor?.businessAddress || "";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 border-0 bg-transparent shadow-2xl">
          {/* Action Bar (Not Printed) */}
          <div className="no-print sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 bg-gray-900 text-white rounded-t-xl shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <DialogTitle className="text-sm font-bold text-white">
                Sale Completed! Print Receipt
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Receipt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onNewSale}
                className="text-gray-300 hover:text-white h-8 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                New Sale
              </Button>
            </div>
          </div>

          {/* Printable 80mm Thermal Receipt */}
          <div
            id="pos-thermal-receipt"
            className="p-6 bg-white text-gray-900 shadow-sm print:p-0 print:m-0 font-mono text-xs"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400 space-y-0.5">
              <p className="text-base font-black uppercase tracking-tight text-gray-900">
                {storeName}
              </p>
              {storeAddress && <p className="text-[11px] text-gray-600">{storeAddress}</p>}
              {storePhone && <p className="text-[11px] text-gray-600">Tel: {storePhone}</p>}
              <p className="text-[10px] uppercase font-bold text-gray-500 pt-1 tracking-wider">
                *** CASH SALE RECEIPT ***
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-bold">{data.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              {data.customerInfo?.fullName && data.customerInfo.fullName !== "Walk-in Customer" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold">{data.customerInfo.fullName}</span>
                </div>
              )}
              {data.customerInfo?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact:</span>
                  <span>{data.customerInfo.phone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[11px] uppercase border-b border-gray-200 pb-1 mb-1.5">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty x Price</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              <div className="space-y-2">
                {data.items.map((item, idx) => {
                  const title = item.name || item.productSnapshot?.name || "Product";
                  const variantVal =
                    item.variantSnapshot?.value || item.variantName || null;

                  return (
                    <div key={idx} className="text-[11px]">
                      <p className="font-bold text-gray-900 leading-tight">
                        {title}
                      </p>
                      {variantVal && (
                        <p className="text-[10px] text-gray-600">
                          ({variantVal})
                        </p>
                      )}
                      <div className="flex justify-between text-gray-700 pt-0.5">
                        <span className="text-gray-500">
                          {item.quantity} x Rs. {Number(item.unitPrice).toFixed(2)}
                        </span>
                        <span className="font-bold">
                          Rs. {Number(item.totalPrice).toFixed(2)}
                        </span>
                      </div>
                      {Number(item.itemDiscount || 0) > 0 && (
                        <p className="text-[10px] text-emerald-700 font-semibold text-right">
                          (Discount: -Rs. {Number(item.itemDiscount).toFixed(2)})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">Rs. {Number(data.subtotal).toFixed(2)}</span>
              </div>

              {Number(data.totalDiscounts) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Discount:</span>
                  <span>- Rs. {Number(data.totalDiscounts).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-900 text-gray-900">
                <span>NET TOTAL:</span>
                <span>Rs. {Number(data.grandTotal).toFixed(2)}</span>
              </div>

              <div className="pt-2 text-[11px] space-y-0.5">
                <div className="flex justify-between text-gray-600">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase text-gray-900">
                    {data.paymentMethod}
                  </span>
                </div>

                {data.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Cash Tendered:</span>
                      <span>Rs. {Number(data.cashReceived || data.grandTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-dotted border-gray-300 pt-0.5">
                      <span>Change Given:</span>
                      <span>Rs. {Number(data.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Receipt Barcode & Footer */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <svg ref={barcodeRef} className="max-w-[200px]" />
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Thank you for your purchase!
              </p>
              <p className="text-[9px] text-gray-400">
                Goods sold in good condition are exchangeable within 7 days with this bill.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global CSS for 80mm / 58mm Thermal Receipt Printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            visibility: hidden !important;
            background: #fff !important;
          }
          #pos-thermal-receipt,
          #pos-thermal-receipt * {
            visibility: visible !important;
          }
          #pos-thermal-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            z-index: 9999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

