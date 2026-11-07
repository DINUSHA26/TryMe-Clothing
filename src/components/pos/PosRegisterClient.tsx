"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  Clock,
  Keyboard,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  Check,
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
  imageUrl?: string | null;
  categoryName?: string;
  variants: PosProductVariant[];
}

export interface CartItem {
  id: string; // unique cart row id
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
  discountAmount: number; // total flat discount for this line item
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
}

export interface HeldCart {
  id: string;
  refCode: string;
  heldAt: string;
  customerName: string;
  customerPhone: string;
  cart: CartItem[];
  overallDiscount: number;
  overallDiscountType: "FIXED" | "PERCENTAGE";
  paymentMethod: "CASH" | "CARD" | "BANK";
  total: number;
  itemCount: number;
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

  // Park / Hold Cart State
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

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

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Sound Synthesizers (Web Audio API)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      /* ignore audio error */
    }
  };

  const playHoldChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch {
      /* ignore audio error */
    }
  };

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        const startTime = audioCtx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      /* ignore audio error */
    }
  };

  // Load Held Carts from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tryme_pos_held_${dashboardRole}`);
      if (saved) {
        setHeldCarts(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse held carts from storage:", e);
    }
  }, [dashboardRole]);

  const saveHeldCarts = (updated: HeldCart[]) => {
    setHeldCarts(updated);
    try {
      localStorage.setItem(`tryme_pos_held_${dashboardRole}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save held carts to storage:", e);
    }
  };

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

  // Clear Cart cleanly (Resets customer name, phone, discounts, and tendered cash)
  const clearCart = useCallback(() => {
    setCart([]);
    setOverallDiscount(0);
    setOverallDiscountType("FIXED");
    setCashReceived("");
    setCustomerName("");
    setCustomerPhone("");
  }, []);

  // Park / Hold Current Cart
  const parkCurrentCart = useCallback(() => {
    if (cart.length === 0) {
      if (heldCarts.length > 0) {
        setIsHeldCartsModalOpen(true);
      } else {
        toast({
          title: "Cart is empty",
          description: "Add items to cart before parking a bill.",
        });
      }
      return;
    }

    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      refCode: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      cart: [...cart],
      overallDiscount,
      overallDiscountType,
      paymentMethod,
      total: netTotal,
      itemCount: cart.reduce((s, i) => s + i.quantity, 0),
    };

    const updated = [newHeld, ...heldCarts];
    saveHeldCarts(updated);
    clearCart();
    playHoldChime();
    toast({
      title: `Ticket Parked #${newHeld.refCode}`,
      description: `Parked total Rs. ${netTotal.toLocaleString("en-LK")}. Register is ready for the next customer.`,
    });
  }, [cart, heldCarts, customerName, customerPhone, overallDiscount, overallDiscountType, paymentMethod, netTotal, clearCart]);

  // Recall a Parked / Held Cart
  const recallHeldCart = (held: HeldCart) => {
    // If active cart currently has items, auto-park active cart first so nothing is lost
    if (cart.length > 0) {
      const autoParked: HeldCart = {
        id: `held-${Date.now()}`,
        refCode: `TKT-${Math.floor(100 + Math.random() * 900)}`,
        heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(),
        cart: [...cart],
        overallDiscount,
        overallDiscountType,
        paymentMethod,
        total: netTotal,
        itemCount: cart.reduce((s, i) => s + i.quantity, 0),
      };
      const remaining = heldCarts.filter((h) => h.id !== held.id);
      saveHeldCarts([autoParked, ...remaining]);
    } else {
      const remaining = heldCarts.filter((h) => h.id !== held.id);
      saveHeldCarts(remaining);
    }

    setCart(held.cart);
    setCustomerName(held.customerName === "Walk-in Customer" ? "" : held.customerName);
    setCustomerPhone(held.customerPhone);
    setOverallDiscount(held.overallDiscount);
    setOverallDiscountType(held.overallDiscountType);
    setPaymentMethod(held.paymentMethod);
    setCashReceived("");
    setIsHeldCartsModalOpen(false);
    playBeep();
    toast({
      title: "Ticket Recalled",
      description: `Ticket #${held.refCode} loaded into the register.`,
    });
  };

  const discardHeldCart = (id: string) => {
    const remaining = heldCarts.filter((h) => h.id !== id);
    saveHeldCarts(remaining);
    toast({
      title: "Parked Ticket Discarded",
      description: "The held cart was removed.",
    });
  };

  // Add Item to Cart
  const addItemToCart = useCallback((product: PosProduct, variant: PosProductVariant | null) => {
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
            description: `Only ${stock} unit(s) available in stock.`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
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
  }, [toast]);

  // Process Scanned Barcode
  const handleBarcodeScanned = useCallback((code: string) => {
    if (!code) return;
    const cleanCode = code.trim().toLowerCase();

    for (const p of products) {
      if (Array.isArray(p.variants)) {
        const matchedVariant = p.variants.find(
          (v) =>
            (v.barcode && v.barcode.trim().toLowerCase() === cleanCode) ||
            (v.sku && v.sku.trim().toLowerCase() === cleanCode) ||
            (v.value && v.value.trim().toLowerCase() === cleanCode)
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
      }

      const matchesBarcode = p.barcode && p.barcode.trim().toLowerCase() === cleanCode;
      const matchesSku = p.sku && p.sku.trim().toLowerCase() === cleanCode;
      const matchesName = p.name && p.name.trim().toLowerCase() === cleanCode;

      if (matchesBarcode || matchesSku || matchesName) {
        playBeep();
        if (p.variants && p.variants.length > 0) {
          setVariantModalProduct(p);
        } else {
          addItemToCart(p, null);
          toast({
            title: "Item Added",
            description: `Added: ${p.name}`,
          });
        }
        return;
      }
    }

    toast({
      variant: "destructive",
      title: "Barcode Not Found",
      description: `No product matching "${code}"`,
    });
  }, [products, addItemToCart, toast]);

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

  // Checkout Execution
  const handleCheckout = useCallback(async () => {
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
      playSuccessChime();
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
      // Clean reset
      clearCart();
      loadProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message,
      });
    } finally {
      setIsCheckingOut(false);
    }
  }, [
    cart,
    paymentMethod,
    numCashReceived,
    netTotal,
    cashReceived,
    apiEndpoint,
    customerName,
    customerPhone,
    calculatedOverallDiscount,
    overallDiscountType,
    subtotal,
    totalDiscounts,
    changeDue,
    storeInfo,
    clearCart,
    toast,
  ]);

  // Unified Global Keyboard Shortcuts & Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // 1. High-Speed Barcode Gun Logic
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = "";
          handleBarcodeScanned(scannedCode);
          return;
        }
      }

      // If characters arrive faster than human typing (< 45ms), it's a barcode gun
      if (diff < 45 || barcodeBufferRef.current.length === 0) {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          barcodeBufferRef.current += e.key;
        }
      } else {
        barcodeBufferRef.current = e.key.length === 1 ? e.key : "";
      }

      // 2. Global POS Function Keys & Hotkeys
      if (e.key === "F1" || (e.ctrlKey && e.key.toLowerCase() === "k") || (e.key === "/" && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        setPaymentMethod("CASH");
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        setPaymentMethod("CARD");
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        setPaymentMethod("BANK");
        return;
      }

      if (e.key === "F6") {
        e.preventDefault();
        setIsOverallDiscountModalOpen(true);
        return;
      }

      if (e.key === "F7") {
        e.preventDefault();
        if (cart.length > 0) {
          parkCurrentCart();
        } else {
          setIsHeldCartsModalOpen(true);
        }
        return;
      }

      if (e.key === "F8") {
        e.preventDefault();
        setPaymentMethod("CASH");
        setCashReceived(netTotal);
        return;
      }

      if (e.key === "F9" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        if (!isCheckingOut && cart.length > 0) {
          handleCheckout();
        }
        return;
      }

      if (e.key === "Escape") {
        if (variantModalProduct) {
          setVariantModalProduct(null);
          return;
        }
        if (itemDiscountModalItem) {
          setItemDiscountModalItem(null);
          return;
        }
        if (isOverallDiscountModalOpen) {
          setIsOverallDiscountModalOpen(false);
          return;
        }
        if (isHeldCartsModalOpen) {
          setIsHeldCartsModalOpen(false);
          return;
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isReceiptModalOpen) {
          setIsReceiptModalOpen(false);
          return;
        }
        if (searchQuery) {
          setSearchQuery("");
          return;
        }
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleBarcodeScanned,
    cart.length,
    parkCurrentCart,
    netTotal,
    isCheckingOut,
    handleCheckout,
    variantModalProduct,
    itemDiscountModalItem,
    isOverallDiscountModalOpen,
    isHeldCartsModalOpen,
    isShortcutsModalOpen,
    isReceiptModalOpen,
    searchQuery,
  ]);

  // Categories list
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.categoryName || "General")))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || (p.categoryName || "General") === selectedCategory;
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
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b shadow-xs">
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

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            <BarcodeIcon className="w-3.5 h-3.5 text-primary" />
            Scanner Active
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

      {/* Visual Keyboard Shortcuts Ribbon / Quick Actions Toolbar */}
      <div className="bg-slate-100/90 dark:bg-slate-900 border-b px-4 py-1.5 flex items-center justify-between overflow-x-auto text-xs scrollbar-none gap-2">
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
          <button
            onClick={() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition-colors shadow-2xs"
            title="Focus Product Search [F1]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F1</kbd>
            Search
          </button>
          <button
            onClick={() => setPaymentMethod("CASH")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors shadow-2xs ${
              paymentMethod === "CASH"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Cash Payment [F2]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F2</kbd>
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod("CARD")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors shadow-2xs ${
              paymentMethod === "CARD"
                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Card Payment [F3]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F3</kbd>
            Card
          </button>
          <button
            onClick={() => setPaymentMethod("BANK")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors shadow-2xs ${
              paymentMethod === "BANK"
                ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="QR / Bank Transfer [F4]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F4</kbd>
            QR/Bank
          </button>
          <button
            onClick={() => setIsOverallDiscountModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition-colors shadow-2xs"
            title="Apply Bill Discount [F6]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F6</kbd>
            Discount
          </button>
          <button
            onClick={parkCurrentCart}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors shadow-2xs ${
              heldCarts.length > 0
                ? "bg-amber-100 text-amber-900 border-amber-300 font-bold dark:bg-amber-950 dark:text-amber-300"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Park Current Cart or View Held Carts [F7]"
          >
            <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F7</kbd>
            {cart.length > 0 ? "Park Cart" : `Held Carts (${heldCarts.length})`}
          </button>
          {cart.length > 0 && paymentMethod === "CASH" && (
            <button
              onClick={() => setCashReceived(netTotal)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition-colors shadow-2xs"
              title="Exact Cash Received [F8]"
            >
              <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-[10px]">F8</kbd>
              Exact
            </button>
          )}
          {cart.length > 0 && (
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
              title="Complete Sale & Print Bill [F9 or Ctrl+Enter]"
            >
              <kbd className="px-1 py-0.2 bg-emerald-700 text-white rounded font-mono font-bold text-[10px]">F9</kbd>
              Pay &amp; Bill
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {heldCarts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHeldCartsModalOpen(true)}
              className="h-6 px-2 text-[11px] font-bold border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 animate-pulse"
            >
              <Clock className="w-3 h-3 mr-1" />
              {heldCarts.length} Parked Ticket{heldCarts.length > 1 ? "s" : ""}
            </Button>
          )}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-semibold px-1.5 py-0.5 rounded"
            title="Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard className="w-3.5 h-3.5" />
            Keys [?]
          </button>
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
                  ref={searchInputRef}
                  placeholder="Search item name, SKU, or scan barcode... (Press F1)"
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
                  const hasVariants = product.variants && product.variants.length > 0;
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
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                              No image
                            </div>
                          )}

                          {/* Stock Badge */}
                          <div className="absolute top-2 left-2">
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold">
                                Out of Stock
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 font-bold ${
                                  product.stock <= 5
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                Stock: {product.stock}
                              </Badge>
                            )}
                          </div>

                          {/* Variants Pill */}
                          {hasVariants && (
                            <div className="absolute bottom-2 right-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-white/90 dark:bg-slate-900/90 font-bold backdrop-blur-xs"
                              >
                                {product.variants.length} Vars
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Title & SKU */}
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                      </div>

                      {/* Pricing & Add Action */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60">
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
          className={`w-full md:w-[390px] lg:w-[430px] xl:w-[470px] flex flex-col bg-white dark:bg-slate-900 border-l ${
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
            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={parkCurrentCart}
                    className="text-xs h-7 px-2 font-bold text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100"
                    title="Park cart to serve next customer [F7]"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Park [F7]
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearCart}
                    className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                    title="Clear current cart & customer info"
                  >
                    Clear Cart
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-sm">Your POS register is empty</p>
                <p className="text-xs text-muted-foreground max-w-[240px] mt-1">
                  Click products on the left, scan items with a barcode scanner, or press{" "}
                  <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">F1</kbd> to search.
                </p>
                {heldCarts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHeldCartsModalOpen(true)}
                    className="mt-4 border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Recall Parked Bill ({heldCarts.length}) [F7]
                  </Button>
                )}
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
                          title="Remove item"
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
              {/* Customer Input Header with 1-click Reset */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-muted-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Customer Details (Optional)
                </span>
                {(customerName || customerPhone) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName("");
                      setCustomerPhone("");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 font-semibold transition-colors"
                    title="Reset to Walk-in customer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Walk-in
                  </button>
                )}
              </div>

              {/* Customer Input (Walk-in or custom) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 pl-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 pl-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Overall Discount Button */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-muted-foreground">Cart Discount:</span>
                <button
                  onClick={() => setIsOverallDiscountModalOpen(true)}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {overallDiscount > 0
                    ? `Applied: ${overallDiscountType === "PERCENTAGE" ? `${overallDiscount}%` : `Rs. ${overallDiscount}`}`
                    : "+ Add Bill Discount (F6)"}
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
                  <div className="flex items-center gap-1">
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">[F2]</span>
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
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">[F3]</span>
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
                  <div className="flex items-center gap-1">
                    <QrCode className="w-4 h-4" />
                    <span>QR / Bank</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">[F4]</span>
                </button>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === "CASH" && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Cash Tendered:</span>
                    <Input
                      type="number"
                      placeholder="Amount received"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="h-8 w-36 text-right font-mono font-bold text-sm bg-white dark:bg-slate-900 border-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Quick Cash Presets & Lankan Rupee Denominations */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setCashReceived(netTotal)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                    >
                      Exact [F8]
                    </button>
                    {[500, 1000, 2000, 5000].map((amt) => {
                      if (amt < netTotal && amt !== netTotal && netTotal > 5000) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashReceived(amt)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                        >
                          Rs.{amt}
                        </button>
                      );
                    })}
                    {/* Add Increment buttons */}
                    {[500, 1000, 5000].map((inc) => (
                      <button
                        key={`inc-${inc}`}
                        type="button"
                        onClick={() => {
                          const curr = Number(cashReceived) || 0;
                          setCashReceived(curr + inc);
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                        title={`Add Rs. ${inc} to tendered cash`}
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>

                  {/* High Visibility Change Due Banner */}
                  {numCashReceived >= netTotal && netTotal > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 p-2.5 rounded-xl flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider block text-emerald-700 dark:text-emerald-400">
                          Change to Return
                        </span>
                        <span className="text-base font-mono font-black">
                          Rs. {changeDue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                        Exact Match / Over
                      </Badge>
                    </div>
                  )}

                  {numCashReceived > 0 && numCashReceived < netTotal && (
                    <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 p-2 rounded-xl flex justify-between items-center text-amber-800 dark:text-amber-300 text-xs">
                      <span className="font-semibold">Short by:</span>
                      <span className="font-mono font-bold">
                        Rs. {(netTotal - numCashReceived).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Sale Button */}
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-11 text-sm font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Sale...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Sale &amp; Print Bill</span>
                    <kbd className="ml-1 px-1.5 py-0.5 bg-black/20 text-white rounded text-[10px] font-mono font-normal">
                      F9
                    </kbd>
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

      {/* ===================== MODAL: HELD / PARKED CARTS ===================== */}
      <Dialog open={isHeldCartsModalOpen} onOpenChange={setIsHeldCartsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Parked &amp; Held Orders ({heldCarts.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3 max-h-[400px] overflow-y-auto">
            {heldCarts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookmarkCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="font-bold text-sm">No parked orders</p>
                <p className="text-xs">
                  When a customer steps away, click <strong>Park Cart [F7]</strong> to save their ticket.
                </p>
              </div>
            ) : (
              heldCarts.map((held) => (
                <div
                  key={held.id}
                  className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-amber-400 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600 text-white font-mono font-bold text-xs">
                        #{held.refCode}
                      </Badge>
                      <span className="font-bold text-sm text-foreground">
                        {held.customerName}
                      </span>
                      {held.customerPhone && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ({held.customerPhone})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{held.heldAt}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>
                      {held.itemCount} items ({held.cart.map((i) => i.name).slice(0, 2).join(", ")}
                      {held.cart.length > 2 ? "..." : ""})
                    </span>
                    <span className="font-black text-sm text-primary font-mono">
                      Rs. {held.total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => discardHeldCart(held.id)}
                      className="text-destructive hover:bg-destructive/10 h-7 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => recallHeldCart(held)}
                      className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Recall to Register
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHeldCartsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MODAL: KEYBOARD SHORTCUTS REFERENCE ===================== */}
      <Dialog open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Keyboard className="w-5 h-5 text-primary" />
              <span>POS Keyboard Shortcuts Cheat Sheet</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs">
            <p className="text-muted-foreground mb-3">
              Use standard counter keyboard shortcuts to execute sales at lightning speed without lifting your hands to the mouse.
            </p>

            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Focus Barcode / Product Search</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F1</kbd>
                  <span className="text-muted-foreground">or</span>
                  <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">/</kbd>
                </div>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Switch to Cash Payment</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F2</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Switch to Card Payment</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F3</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Switch to QR / Bank Transfer</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F4</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Apply Overall Bill Discount</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F6</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Park / Hold Cart or Recall</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F7</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Tender Exact Cash Amount</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F8</kbd>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Complete Sale &amp; Print Bill</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">F9</kbd>
                  <span className="text-muted-foreground">or</span>
                  <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">Ctrl+Enter</kbd>
                </div>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="font-medium">Close Modal / Clear Search</span>
                <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold">Esc</kbd>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setIsShortcutsModalOpen(false)}>
              Got it
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
