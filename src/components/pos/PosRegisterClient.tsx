"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Search,
  Barcode as BarcodeIcon,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  User,
  Phone,
  RefreshCw,
  Camera,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PosReceiptModal, type PosReceiptData } from "./PosReceiptModal";

export interface PosProductVariant {
  id: string;
  name: string;
  value: string;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
  priceAdjustment: number;
  imageUrl?: string | null;
}

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  barcode: string;
  stock: number;
  categoryName: string;
  imageUrl?: string | null;
  variants: PosProductVariant[];
}

export interface CartItem {
  id: string; // unique cart line id (e.g. `${productId}-${variantId || 'base'}`)
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
  discountAmount: number;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
}

interface PosRegisterClientProps {
  apiEndpoint: string; // e.g. "/api/vendor/pos" or "/api/ads-seller/pos"
  dashboardRole: "vendor" | "ads-seller";
  initialStoreName?: string;
}

export function PosRegisterClient({
  apiEndpoint,
  dashboardRole,
  initialStoreName = "Store POS",
}: PosRegisterClientProps) {
  const { toast } = useToast();

  const [products, setProducts] = useState<PosProduct[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>({ businessName: initialStoreName });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [overallDiscountType, setOverallDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");

  // Customer State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK">("CASH");
  const [cashReceived, setCashReceived] = useState<number | string>("");

  // Modals
  const [variantModalProduct, setVariantModalProduct] = useState<PosProduct | null>(null);
  const [itemDiscountModalItem, setItemDiscountModalItem] = useState<CartItem | null>(null);
  const [itemDiscountValue, setItemDiscountValue] = useState<string>("");
  const [itemDiscountType, setItemDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [isOverallDiscountModalOpen, setIsOverallDiscountModalOpen] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState<"catalog" | "cart">("catalog");

  // Checkout & Receipt
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receiptData, setReceiptData] = useState<PosReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Barcode Gun listener buffer
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Fetch products
  const loadProducts = async (query = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products || []);
        if (data.data.vendor) {
          setStoreInfo(data.data.vendor);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load products",
          description: data.error,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [apiEndpoint]);

  // Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in regular text inputs (except if barcode was scanned)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = "";
          handleBarcodeScanned(scannedCode);
        }
        return;
      }

      // If characters arrive faster than human typing (< 50ms), it's a barcode gun
      if (diff < 50 || barcodeBufferRef.current.length === 0) {
        if (e.key.length === 1) {
          barcodeBufferRef.current += e.key;
        }
      } else {
        barcodeBufferRef.current = e.key.length === 1 ? e.key : "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  // Process Scanned Barcode
  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim().toLowerCase();

    // Check if matches product SKU/Barcode
    for (const p of products) {
      // Check variants
      const matchedVariant = p.variants.find(
        (v) => v.barcode.toLowerCase() === cleanCode || v.sku.toLowerCase() === cleanCode
      );
      if (matchedVariant) {
        playBeep();
        addItemToCart(p, matchedVariant);
        toast({
          title: "Barcode Scanned",
          description: `Added: ${p.name} (${matchedVariant.value})`,
        });
        return;
      }

      // Check main product
      if (p.barcode.toLowerCase() === cleanCode || p.sku.toLowerCase() === cleanCode) {
        playBeep();
        if (p.variants.length > 0) {
          setVariantModalProduct(p);
        } else {
          addItemToCart(p, null);
          toast({
            title: "Barcode Scanned",
            description: `Added: ${p.name}`,
          });
        }
        return;
      }
    }

    toast({
      variant: "destructive",
      title: "Barcode Not Found",
      description: `No product matching barcode "${code}"`,
    });
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      /* ignore audio error */
    }
  };

  // Add Item to Cart
  const addItemToCart = (product: PosProduct, variant: PosProductVariant | null) => {
    const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}-base`;
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;

    if (stock <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `"${product.name}${variant ? ` (${variant.value})` : ""}" is currently out of stock.`,
      });
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === cartItemId);
      if (existing) {
        if (existing.quantity >= stock) {
          toast({
            variant: "destructive",
            title: "Max Stock Reached",
            description: `Only ${stock} items available in stock.`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: cartItemId,
          productId: product.id,
          variantId: variant?.id || null,
          name: product.name,
          variantName: variant ? `${variant.name || "Option"}: ${variant.value}` : null,
          sku: variant?.sku || product.sku,
          price,
          quantity: 1,
          stock,
          imageUrl: variant?.imageUrl || product.imageUrl,
          discountAmount: 0,
          discountType: "FIXED",
          discountValue: 0,
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (newQty > item.stock) {
            toast({
              variant: "destructive",
              title: "Stock Limit",
              description: `Maximum available stock is ${item.stock}`,
            });
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setCashReceived("");
  };

  // Item Discount Apply
  const applyItemDiscount = () => {
    if (!itemDiscountModalItem) return;
    const val = parseFloat(itemDiscountValue) || 0;
    const itemTotal = itemDiscountModalItem.price * itemDiscountModalItem.quantity;
    let discountAmount = 0;

    if (itemDiscountType === "PERCENTAGE") {
      discountAmount = (itemTotal * val) / 100;
    } else {
      discountAmount = val;
    }

    discountAmount = Math.min(itemTotal, Math.max(0, discountAmount));

    setCart((prev) =>
      prev.map((item) =>
        item.id === itemDiscountModalItem.id
          ? {
              ...item,
              discountAmount,
              discountType: itemDiscountType,
              discountValue: val,
            }
          : item
      )
    );

    setItemDiscountModalItem(null);
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + (item.discountAmount || 0), 0);

  let calculatedOverallDiscount = 0;
  if (overallDiscount > 0) {
    if (overallDiscountType === "PERCENTAGE") {
      calculatedOverallDiscount = (subtotal * overallDiscount) / 100;
    } else {
      calculatedOverallDiscount = Number(overallDiscount);
    }
  }
  calculatedOverallDiscount = Math.min(subtotal - totalItemDiscounts, calculatedOverallDiscount);

  const totalDiscounts = totalItemDiscounts + calculatedOverallDiscount;
  const netTotal = Math.max(0, subtotal - totalDiscounts);

  const numCashReceived = Number(cashReceived) || 0;
  const changeDue = paymentMethod === "CASH" ? Math.max(0, numCashReceived - netTotal) : 0;

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Cart is empty" });
      return;
    }

    if (paymentMethod === "CASH" && numCashReceived < netTotal && cashReceived !== "") {
      toast({
        variant: "destructive",
        title: "Insufficient Cash Received",
        description: `Cash received (Rs. ${numCashReceived}) is less than total (Rs. ${netTotal})`,
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch(`${apiEndpoint}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart,
          customerInfo: {
            fullName: customerName.trim() || "Walk-in Customer",
            phone: customerPhone.trim(),
          },
          paymentMethod,
          cashReceived: paymentMethod === "CASH" ? (numCashReceived || netTotal) : netTotal,
          overallDiscount: calculatedOverallDiscount,
          overallDiscountType,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Checkout Failed",
          description: result.error,
        });
        return;
      }

      // Success: prepare receipt and open receipt dialog
      setReceiptData({
        orderNumber: result.data.orderNumber,
        items: result.data.items || cart,
        subtotal,
        totalDiscounts,
        grandTotal: netTotal,
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? (numCashReceived || netTotal) : netTotal,
        changeDue,
        createdAt: new Date().toISOString(),
        customerInfo: {
          fullName: customerName.trim() || "Walk-in Customer",
          phone: customerPhone.trim(),
        },
        vendor: result.data.vendor || storeInfo,
      });

      setIsReceiptModalOpen(true);
      clearCart();
      loadProducts(); // reload fresh stock levels
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Categories list
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.categoryName)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.categoryName === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants.some((v) => v.value.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top POS Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b shadow-xs">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-sm sm:text-base text-foreground">
            {storeInfo.businessName} POS
          </span>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
            Live Register
          </Badge>
        </div>

        {/* Mobile Switch Tabs: Catalog vs Cart */}
        <div className="md:hidden flex items-center">
          <Tabs
            value={mobileViewTab}
            onValueChange={(val: any) => setMobileViewTab(val)}
            className="w-auto"
          >
            <TabsList className="h-8">
              <TabsTrigger value="catalog" className="text-xs px-2.5 py-1">
                Products
              </TabsTrigger>
              <TabsTrigger value="cart" className="text-xs px-2.5 py-1 relative">
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 inline-flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <BarcodeIcon className="w-3.5 h-3.5 text-primary" />
            Scanner Active (Ready)
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="h-7 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Responsive across Desktop, Tablet, Mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ===================== LEFT: PRODUCT CATALOG ===================== */}
        <div
          className={`flex-1 flex flex-col overflow-hidden border-r bg-slate-50/50 dark:bg-slate-900/50 ${
            mobileViewTab === "cart" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search & Barcode Quick Field */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search item name, SKU, or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      handleBarcodeScanned(searchQuery.trim());
                      setSearchQuery("");
                    }
                  }}
                  className="pl-9 h-10 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleBarcodeScanned(searchQuery.trim());
                    setSearchQuery("");
                  }
                }}
                className="h-10 px-3 font-bold"
              >
                Scan / Enter
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-200/70 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid: Responsive 2 to 4 columns */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading products...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold">No products found</p>
                <p className="text-xs">Try different keywords or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                  const hasVariants = product.variants.length > 0;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (isOutOfStock) return;
                        if (hasVariants) {
                          setVariantModalProduct(product);
                        } else {
                          addItemToCart(product, null);
                        }
                      }}
                      className={`group relative p-2.5 sm:p-3 bg-white dark:bg-slate-800 border rounded-2xl cursor-pointer transition-all hover:shadow-md hover:border-primary active:scale-[0.98] flex flex-col justify-between ${
                        isOutOfStock ? "opacity-60 grayscale cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Image Thumbnail */}
                        <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <BarcodeIcon className="w-8 h-8" />
                            </div>
                          )}

                          {/* Stock Badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs ${
                                isOutOfStock
                                  ? "bg-red-500 text-white"
                                  : product.stock <= 5
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {isOutOfStock ? "Out of Stock" : `Stock: ${product.stock}`}
                            </span>
                          </div>

                          {/* Has Variants Badge */}
                          {hasVariants && (
                            <div className="absolute top-1.5 right-1.5">
                              <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs inline-flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                {product.variants.length} Vars
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & SKU */}
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 leading-snug">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {product.sku}
                          </p>
                        </div>
                      </div>

                      {/* Price Bar */}
                      <div className="mt-2 pt-2 border-t flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-primary">
                          Rs. {product.price.toLocaleString("en-LK")}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0 rounded-full font-bold"
                          disabled={isOutOfStock}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT: CART & POS REGISTER ===================== */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-slate-900 border-l ${
            mobileViewTab === "catalog" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Cart Header */}
          <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm sm:text-base">Current Cart</h2>
              <Badge variant="secondary" className="font-bold text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </Badge>
            </div>
            {cart.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCart}
                className="text-xs text-destructive hover:bg-destructive/10 h-7"
              >
                Clear Cart
              </Button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-sm">Your POS register is empty</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Click products on the left or scan items with a barcode scanner
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const lineRaw = item.price * item.quantity;
                const lineNet = lineRaw - item.discountAmount;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl flex items-start gap-3 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 relative overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                          Item
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantName && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                          {item.variantName}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-lg bg-white dark:bg-slate-900">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price & Discount Trigger */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                setItemDiscountModalItem(item);
                                setItemDiscountValue(
                                  item.discountValue > 0 ? String(item.discountValue) : ""
                                );
                                setItemDiscountType(item.discountType || "FIXED");
                              }}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${
                                item.discountAmount > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <Percent className="w-2.5 h-2.5" />
                              {item.discountAmount > 0 ? `Disc: -Rs.${item.discountAmount}` : "Disc"}
                            </button>
                            <span className="font-black text-xs sm:text-sm text-foreground">
                              Rs. {lineNet.toLocaleString("en-LK")}
                            </span>
                          </div>
                          {item.discountAmount > 0 && (
                            <span className="text-[10px] text-muted-foreground line-through block">
                              Rs. {lineRaw.toLocaleString("en-LK")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer & Overall Discount Controls */}
          {cart.length > 0 && (
            <div className="p-3 border-t bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
              {/* Customer Input (Walk-in or custom) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 pl-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 pl-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Overall Discount Button */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Cart Discount:</span>
                <button
                  onClick={() => setIsOverallDiscountModalOpen(true)}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {overallDiscount > 0
                    ? `Applied: ${overallDiscountType === "PERCENTAGE" ? `${overallDiscount}%` : `Rs. ${overallDiscount}`}`
                    : "+ Add Bill Discount"}
                </button>
              </div>
            </div>
          )}

          {/* Payment Method & Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t bg-white dark:bg-slate-900 space-y-3">
              {/* Financial Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Total Discounts:</span>
                    <span>- Rs. {totalDiscounts.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t text-sm font-black text-foreground">
                  <span className="uppercase tracking-wider">Net Total:</span>
                  <span className="text-xl text-primary font-mono font-black">
                    Rs. {netTotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "CARD"
                      ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "BANK"
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  QR / Bank
                </button>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === "CASH" && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Cash Tendered:</span>
                    <Input
                      type="number"
                      placeholder="Amount received"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="h-8 w-32 text-right font-mono font-bold text-sm bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex gap-1.5 justify-end">
                    {[netTotal, 1000, 2000, 5000].map((amt) => {
                      if (amt < netTotal && amt !== netTotal) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashReceived(amt)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700"
                        >
                          {amt === netTotal ? "Exact" : `Rs.${amt}`}
                        </button>
                      );
                    })}
                  </div>

                  {numCashReceived >= netTotal && (
                    <div className="flex justify-between items-center text-xs font-black text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>CHANGE DUE:</span>
                      <span className="text-sm font-mono">
                        Rs. {changeDue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Sale Button */}
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-11 text-sm font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing Sale...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Sale &amp; Print Bill
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL: VARIANT PICKER ===================== */}
      <Dialog
        open={!!variantModalProduct}
        onOpenChange={(open) => !open && setVariantModalProduct(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Select Variant - {variantModalProduct?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2 max-h-[350px] overflow-y-auto">
            {variantModalProduct?.variants.map((v) => {
              const isVarOutOfStock = v.stock <= 0;
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (isVarOutOfStock) return;
                    addItemToCart(variantModalProduct, v);
                    setVariantModalProduct(null);
                  }}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-primary hover:bg-accent/40 ${
                    isVarOutOfStock ? "opacity-50 grayscale cursor-not-allowed" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-foreground">
                      {v.name || "Option"}: {v.value}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{v.sku}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-sm text-primary">
                      Rs. {v.price.toLocaleString("en-LK")}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        isVarOutOfStock ? "text-destructive" : "text-emerald-600"
                      }`}
                    >
                      {isVarOutOfStock ? "Out of Stock" : `Stock: ${v.stock}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL: ITEM DISCOUNT ===================== */}
      <Dialog
        open={!!itemDiscountModalItem}
        onOpenChange={(open) => !open && setItemDiscountModalItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-primary" />
              Item Discount - {itemDiscountModalItem?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={itemDiscountType === "FIXED" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setItemDiscountType("FIXED")}
              >
                Flat Amount (Rs.)
              </Button>
              <Button
                type="button"
                variant={itemDiscountType === "PERCENTAGE" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setItemDiscountType("PERCENTAGE")}
              >
                Percentage (%)
              </Button>
            </div>

            <div>
              <Label className="text-xs block mb-1">
                Discount Value ({itemDiscountType === "FIXED" ? "Rs." : "%"})
              </Label>
              <Input
                type="number"
                placeholder={itemDiscountType === "FIXED" ? "e.g. 200" : "e.g. 10"}
                value={itemDiscountValue}
                onChange={(e) => setItemDiscountValue(e.target.value)}
                className="font-bold text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItemDiscountValue("");
                applyItemDiscount();
              }}
            >
              Remove
            </Button>
            <Button size="sm" onClick={applyItemDiscount} className="font-bold">
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL: OVERALL CART DISCOUNT ===================== */}
      <Dialog
        open={isOverallDiscountModalOpen}
        onOpenChange={setIsOverallDiscountModalOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" />
              Overall Bill Discount
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={overallDiscountType === "FIXED" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setOverallDiscountType("FIXED")}
              >
                Flat Amount (Rs.)
              </Button>
              <Button
                type="button"
                variant={overallDiscountType === "PERCENTAGE" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setOverallDiscountType("PERCENTAGE")}
              >
                Percentage (%)
              </Button>
            </div>

            <div>
              <Label className="text-xs block mb-1">
                Overall Discount Value ({overallDiscountType === "FIXED" ? "Rs." : "%"})
              </Label>
              <Input
                type="number"
                placeholder={overallDiscountType === "FIXED" ? "e.g. 500" : "e.g. 10"}
                value={overallDiscount || ""}
                onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                className="font-bold text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOverallDiscount(0);
                setIsOverallDiscountModalOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOverallDiscountModalOpen(false)}
              className="font-bold"
            >
              Apply Bill Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL: POS THERMAL RECEIPT ===================== */}
      <PosReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          clearCart();
        }}
        data={receiptData}
      />
    </div>
  );
}

