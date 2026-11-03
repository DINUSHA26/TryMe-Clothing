"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Printer,
  X,
  Store,
  Globe,
  CreditCard,
  Banknote,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface PrintOrderBillModalProps {
  order: {
    id: string;
    orderNumber: string;
    orderSource?: "TRYME_MARKETPLACE" | "VENDOR_WEBSITE" | string;
    paymentMethod?: string;
    paymentStatus?: string;
    status: string;
    bankReference?: string | null;
    shippingAmount?: number;
    totalAmount?: number;
    notes?: string | null;
    customerEmail?: string;
    createdAt: string;
  };
  vendorItems: Array<{
    id: string;
    productSnapshot: any;
    variantSnapshot?: any;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount?: number;
    discountedTotalPrice?: number;
    status: string;
  }>;
  shippingAddress: any;
  vendor?: {
    id?: string;
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string | null;
    logo?: string | null;
    slug?: string;
    websiteConfig?: any;
  } | null;
  triggerButton?: React.ReactNode;
}

export function PrintOrderBillModal({
  order,
  vendorItems,
  shippingAddress,
  vendor,
  triggerButton,
}: PrintOrderBillModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isWebsiteOrder =
    order.orderSource === "VENDOR_WEBSITE" ||
    order.orderNumber.startsWith("WEB-");

  // Derive vendor store branding info
  const websiteHero = vendor?.websiteConfig?.heroSection as any;
  const websiteContact = vendor?.websiteConfig?.contactSection as any;

  const storeName =
    vendor?.businessName ||
    websiteHero?.title ||
    "Official Store";

  const storeLogo =
    vendor?.logo ||
    websiteHero?.logo ||
    null;

  const storeTagline =
    websiteHero?.subtitle ||
    websiteHero?.badgeText ||
    "Official Direct Store";

  const storeAddress =
    websiteContact?.address ||
    vendor?.businessAddress ||
    "";

  const storePhone =
    websiteContact?.phone ||
    vendor?.businessPhone ||
    "";

  const storeEmail =
    websiteContact?.email ||
    vendor?.businessEmail ||
    "";

  const storeWebsite =
    vendor?.slug
      ? `tryme.lk/site/${vendor.slug}`
      : "";

  // Financial calculations
  const itemsSubtotal = vendorItems.reduce(
    (sum, item) => sum + Number(item.totalPrice || 0),
    0
  );
  const totalDiscount = vendorItems.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0
  );
  const shippingFee = Number(order.shippingAmount || 0);
  const grandTotal = Math.max(0, itemsSubtotal - totalDiscount + shippingFee);

  // Format date safely
  let orderDateFormatted = "";
  try {
    orderDateFormatted = format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a");
  } catch {
    orderDateFormatted = order.createdAt;
  }

  const handlePrint = () => {
    window.print();
  };

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
              className="font-bold border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print Bill</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-0 bg-transparent shadow-2xl">
          {/* Action Bar (Not Printed) */}
          <div className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-gray-900 text-white rounded-t-xl shadow-md">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-400" />
              <DialogTitle className="text-base font-bold text-white">
                Order Bill &amp; Summary ({order.orderNumber})
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div
            id="printable-order-bill"
            className="p-8 sm:p-12 bg-white text-gray-900 shadow-sm print:shadow-none print:p-6 print:m-0"
          >
            {/* Header: Dynamic Branding depending on Order Source */}
            {isWebsiteOrder ? (
              /* =================== OWN WEBSITE ORDER HEADER =================== */
              <div className="border-b-2 border-gray-900 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    {storeLogo ? (
                      <img
                        src={storeLogo}
                        alt={storeName}
                        className="h-12 max-w-[180px] object-contain mb-2"
                      />
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xl font-black text-gray-900 tracking-tight mb-1">
                        <Store className="w-6 h-6 text-indigo-600" />
                        <span>{storeName}</span>
                      </div>
                    )}
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                      {storeName}
                    </h1>
                    {storeTagline && (
                      <p className="text-xs font-semibold text-gray-600">
                        {storeTagline}
                      </p>
                    )}
                    {storeAddress && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {storeAddress}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 pt-1">
                      {storePhone && <span>Tel: {storePhone}</span>}
                      {storeEmail && <span>Email: {storeEmail}</span>}
                      {storeWebsite && <span>Website: {storeWebsite}</span>}
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1.5">
                    <div className="inline-block bg-indigo-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded tracking-wide">
                      Direct Store Order Invoice
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Invoice / Order #
                      </p>
                      <p className="text-2xl font-mono font-black text-gray-900">
                        {order.orderNumber}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Date: {orderDateFormatted}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* =================== TRYME.LK MARKETPLACE ORDER HEADER =================== */
              <div className="border-b-2 border-gray-900 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-md">
                    {/* Marketplace Brand */}
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#f97316] text-white font-black text-2xl px-2.5 py-0.5 rounded tracking-tighter">
                        TryMe<span className="text-gray-900">.lk</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Marketplace Bill
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      Sri Lanka's Premier Multi-Vendor Online Marketplace
                    </p>
                    <p className="text-xs text-gray-600">
                      Web: www.tryme.lk | Email: support@tryme.lk
                    </p>

                    {/* Sold by / Shop Name info */}
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        Sold &amp; Fulfilled By Merchant
                      </p>
                      <p className="text-sm font-black text-gray-900 mt-0.5">
                        {storeName}
                      </p>
                      {storeAddress && (
                        <p className="text-xs text-gray-600 mt-0.5">{storeAddress}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-600 mt-1">
                        {storePhone && <span>Tel: {storePhone}</span>}
                        {storeEmail && <span>Email: {storeEmail}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1.5">
                    <div className="inline-block bg-orange-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded tracking-wide">
                      TryMe.lk Marketplace Invoice
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Order #
                      </p>
                      <p className="text-2xl font-mono font-black text-gray-900">
                        {order.orderNumber}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Date: {orderDateFormatted}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Information Grid: Customer Delivery & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 mb-6 border-b border-gray-200 text-sm">
              {/* Delivery To */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-1">
                <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-700" />
                  Delivery &amp; Customer Information
                </p>
                <p className="text-base font-black text-gray-900 pt-1">
                  {shippingAddress?.fullName || "Valued Customer"}
                </p>
                <p className="text-xs text-gray-700">
                  {shippingAddress?.addressLine1}
                </p>
                {shippingAddress?.addressLine2 && (
                  <p className="text-xs text-gray-700">
                    {shippingAddress.addressLine2}
                  </p>
                )}
                <p className="text-xs text-gray-700">
                  {shippingAddress?.city}
                  {shippingAddress?.province ? `, ${shippingAddress.province}` : ""}
                  {shippingAddress?.postalCode ? ` ${shippingAddress.postalCode}` : ""}
                </p>
                <p className="text-xs text-gray-700 font-medium">
                  {shippingAddress?.country || "Sri Lanka"}
                </p>
                <div className="pt-2 text-xs space-y-0.5 text-gray-700">
                  {shippingAddress?.phone && (
                    <p className="flex items-center gap-1 font-semibold">
                      <Phone className="w-3 h-3 text-gray-600" />
                      <span>{shippingAddress.phone}</span>
                    </p>
                  )}
                  {order.customerEmail && (
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-600" />
                      <span>{order.customerEmail}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Order & Payment Meta */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-2">
                <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-700" />
                  Payment &amp; Order Status
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Channel:</span>
                    <span className="font-bold text-gray-900">
                      {isWebsiteOrder ? "Direct Website Order" : "TryMe.lk Marketplace"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Payment Method:</span>
                    <span className="font-bold text-gray-900">
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery (COD)"
                        : order.paymentMethod === "BANK_DEPOSIT"
                        ? "Direct Bank Deposit"
                        : order.paymentMethod || "Online Card Payment"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Payment Status:</span>
                    <span className="font-bold text-gray-900">
                      {order.paymentStatus || "PENDING"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-gray-500 font-medium">Fulfillment Status:</span>
                    <span className="font-bold text-gray-900">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {order.bankReference && (
                    <div className="flex justify-between items-center py-1 bg-blue-50 px-2 rounded border border-blue-200">
                      <span className="text-blue-800 font-bold">Bank Reference:</span>
                      <span className="font-mono font-bold text-blue-900">
                        {order.bankReference}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gray-800" />
                Ordered Items Summary ({vendorItems.length})
              </h2>

              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-800 border-b border-gray-300">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    {totalDiscount > 0 && (
                      <th className="py-2.5 px-3 text-right">Discount</th>
                    )}
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {vendorItems.map((item, idx) => {
                    const snap = item.productSnapshot || {};
                    const variantSnap = item.variantSnapshot;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900 text-sm">
                            {snap.name || "Product"}
                          </p>
                          {variantSnap && (
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              {variantSnap.name ||
                                Object.entries(variantSnap)
                                  .filter(
                                    ([k, v]) =>
                                      typeof v === "string" &&
                                      !["id", "sku", "image"].includes(k)
                                  )
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(" | ")}
                            </p>
                          )}
                          {snap.sku && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              SKU: {snap.sku}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-gray-800">
                          Rs.{" "}
                          {Number(item.unitPrice).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-900">
                          {item.quantity}
                        </td>
                        {totalDiscount > 0 && (
                          <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                            {Number(item.discountAmount) > 0
                              ? `- Rs. ${Number(item.discountAmount).toLocaleString("en-LK", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "-"}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          Rs.{" "}
                          {(Number(item.discountedTotalPrice) > 0
                            ? Number(item.discountedTotalPrice)
                            : Number(item.totalPrice)
                          ).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pb-6 border-b border-gray-200">
              {/* Order Notes / Instructions */}
              <div>
                {order.notes ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">
                      Special Delivery Instructions / Notes
                    </p>
                    <p className="text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 italic">
                    No additional customer delivery notes provided.
                  </div>
                )}
              </div>

              {/* Totals Table */}
              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Subtotal:</span>
                  <span className="font-bold text-gray-900">
                    Rs.{" "}
                    {itemsSubtotal.toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-700">
                    <span className="font-medium">Discount / Coupon:</span>
                    <span className="font-bold">
                      - Rs.{" "}
                      {totalDiscount.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Delivery / Shipping:</span>
                  <span className="font-bold text-gray-900">
                    {shippingFee > 0
                      ? `Rs. ${shippingFee.toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "Free Delivery"}
                  </span>
                </div>

                <div className="flex justify-between py-2.5 px-3 bg-gray-900 text-white rounded-lg text-sm font-black mt-2">
                  <span className="uppercase tracking-wider">Grand Total:</span>
                  <span className="font-mono text-base">
                    Rs.{" "}
                    {grandTotal.toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill Footer & Terms */}
            <div className="pt-6 text-center space-y-1.5 text-xs text-gray-500">
              <p className="font-bold text-gray-800">
                {isWebsiteOrder
                  ? `Thank you for shopping directly with ${storeName}!`
                  : `Thank you for ordering on TryMe.lk Marketplace! Fulfilled by ${storeName}.`}
              </p>
              <p className="text-[11px] text-gray-500">
                {isWebsiteOrder
                  ? storePhone
                    ? `For customer inquiries or order assistance, please call ${storePhone} or email ${storeEmail || "our store"}.`
                    : "For customer inquiries or order assistance, please contact our store."
                  : "For platform inquiries or support, please visit www.tryme.lk or contact support@tryme.lk."}
              </p>
              <p className="text-[10px] text-gray-400 pt-1">
                This is a computer-generated invoice and requires no physical signature.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global CSS to isolate #printable-order-bill when printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            visibility: hidden !important;
            background: #ffffff !important;
          }
          #printable-order-bill,
          #printable-order-bill * {
            visibility: visible !important;
          }
          #printable-order-bill {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #111827 !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
