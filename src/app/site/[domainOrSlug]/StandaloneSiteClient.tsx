"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ContactSectionClient from "./ContactSectionClient";
import FooterSectionClient from "./FooterSectionClient";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Star,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Building2,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Truck,
  ShieldCheck,
  Send,
  Upload,
  X,
  Package,
  FileText,
  ExternalLink,
  Clock,
  Zap,
  Check,
  Loader2,
  Menu,
} from "lucide-react";

interface CartItem {
  cartItemId: string;
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  variantId?: string | null;
  variantLabel?: string | null;
  itemType: "PRODUCT" | "SERVICE" | "AD";
  stock?: number;
}

interface StandaloneSiteClientProps {
  domainOrSlug: string;
  siteData: any;
  initialPageSlug?: string | null;
  initialItemSlug?: string | null;
  isPreview?: boolean;
  previewDevice?: "desktop" | "tablet" | "mobile";
  onPreviewPageSelect?: (slug: string) => void;
}

export default function StandaloneSiteClient({
  domainOrSlug,
  siteData,
  initialPageSlug = null,
  initialItemSlug = null,
  isPreview = false,
  previewDevice = "desktop",
  onPreviewPageSelect,
}: StandaloneSiteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { vendor, config, products = [], subscription } = siteData;
  const entityType: "VENDOR" | "ADS_SELLER" =
    siteData.type === "ADS_SELLER" || siteData.entityType === "ADS_SELLER"
      ? "ADS_SELLER"
      : "VENDOR";

  // Determine whether this is a 1-Page Website or a 6/12-Page Multi-Page Website
  const rawTier =
    siteData.tier ||
    subscription?.tier ||
    (config?.footerSection as any)?.ecommerceConfig?.websiteMode ||
    (config?.pages && config.pages.length > 0 ? "SIX_PAGES" : "ONE_PAGE");

  const isMultiPage =
    rawTier === "SIX_PAGES" ||
    rawTier === "TWELVE_PAGES" ||
    rawTier === "MULTI_PAGE";

  // E-Commerce & Inquiry Configuration
  const ecommerceConfig = (config?.footerSection as any)?.ecommerceConfig || {};
  const codEnabled = ecommerceConfig.codEnabled !== false;
  const bankDepositEnabled = ecommerceConfig.bankDepositEnabled !== false;
  const shippingFee = Number(ecommerceConfig.shippingFee ?? 350);
  const freeShippingThreshold = Number(ecommerceConfig.freeShippingThreshold ?? 0);
  const deliveryEstimate =
    ecommerceConfig.deliveryEstimate || "2 - 4 Working Days Islandwide";
  const bankDetails = ecommerceConfig.bankDetails || {
    bankName: "Commercial Bank / BOC / Sampath Bank",
    accountName: vendor?.businessName || "Official Store Account",
    accountNumber: "Contact store for account number",
    branch: "Main Branch",
    instructions: "Please upload your bank transfer receipt or enter the reference number.",
  };

  // URL / State Driven Navigation
  const queryPage = isPreview ? initialPageSlug : searchParams?.get("page") || initialPageSlug;
  const queryItem = isPreview ? initialItemSlug : searchParams?.get("item") || initialItemSlug;

  const [activePage, setActivePage] = useState<string>(queryPage || "home");
  const [activeItemSlug, setActiveItemSlug] = useState<string | null>(queryItem || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isPreview) {
      const p = searchParams?.get("page") || "home";
      const it = searchParams?.get("item") || null;
      setActivePage(p);
      setActiveItemSlug(it);
    }
  }, [searchParams, isPreview]);

  useEffect(() => {
    if (isPreview && initialPageSlug) {
      setActivePage(initialPageSlug);
    }
  }, [initialPageSlug, isPreview]);

  // Helper: Determine whether the browser is on a standalone Custom Domain vs TryMe /site/[slug] path
  const getPublicBasePath = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const isTryMeMainHost =
        host === "tryme.lk" ||
        host.endsWith(".tryme.lk") ||
        host === "try-me-clothing.vercel.app" ||
        (host.startsWith("try-me-clothing") && host.endsWith(".vercel.app")) ||
        host === "localhost" ||
        host === "127.0.0.1";

      if (!isTryMeMainHost) {
        return "/";
      }
    }
    // Also if domainOrSlug is a domain name (contains a dot) and not on localhost/tryme
    return `/site/${domainOrSlug}`;
  };

  // On initial mount on a custom domain, ensure the browser URL bar never shows /site/<domain>
  useEffect(() => {
    if (isPreview || typeof window === "undefined") return;
    const basePath = getPublicBasePath();
    if (basePath === "/" && window.location.pathname.startsWith("/site/")) {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      window.history.replaceState(null, "", `/${search}${hash}`);
    }
  }, [isPreview, domainOrSlug]);

  const navigateTo = (page: string, itemSlug?: string | null) => {
    setActivePage(page);
    setActiveItemSlug(itemSlug || null);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (isPreview) {
      onPreviewPageSelect?.(page);
      return;
    }
    const params = new URLSearchParams();
    if (page && page !== "home") {
      params.set("page", page);
    }
    if (itemSlug) {
      params.set("item", itemSlug);
    }
    const qs = params.toString();
    const basePath = getPublicBasePath();
    const targetUrl =
      basePath === "/"
        ? `/${qs ? `?${qs}` : ""}`
        : `${basePath}${qs ? `?${qs}` : ""}`;
    router.push(targetUrl, { scroll: false });
  };

  // Persistent Cart State (for 6-page / 12-page websites)
  const cartStorageKey = `tryme_site_cart_${vendor?.slug || domainOrSlug}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {}
  }, [cartStorageKey]);

  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
      } catch {}
    }
  };

  const showToast = (msg: string) => {
    setCartToast(msg);
    setTimeout(() => setCartToast(null), 3200);
  };

  const addToCart = (
    item: any,
    qty = 1,
    variant?: { id: string; name: string; value: string; priceAdjustment?: number } | null,
    itemType: "PRODUCT" | "SERVICE" | "AD" = "PRODUCT"
  ) => {
    const basePrice =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0;
    const unitPrice = Math.max(0, basePrice + (variant?.priceAdjustment || 0));
    const cartItemId = `${item.id || item.slug || item.name}-${variant?.id || "default"}`;

    const existingIndex = cart.findIndex((c) => c.cartItemId === cartItemId);
    let updated: CartItem[];
    if (existingIndex >= 0) {
      updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
      };
    } else {
      updated = [
        ...cart,
        {
          cartItemId,
          id: item.id || item.slug || `item-${Date.now()}`,
          productId: item.id || "",
          name: item.title || item.name || "Store Item",
          slug: item.slug || item.id || "",
          price: unitPrice,
          image:
            item.image ||
            item.imageUrl ||
            item.images?.[0]?.url ||
            (typeof item.images?.[0] === "string" ? item.images[0] : null),
          quantity: qty,
          variantId: variant?.id || null,
          variantLabel: variant ? `${variant.name}: ${variant.value}` : null,
          itemType,
          stock: item.stock ?? 99,
        },
      ];
    }
    saveCart(updated);
    showToast(`Added "${item.title || item.name}" to your cart!`);
  };

  const handleBuyNow = (
    item: any,
    qty = 1,
    variant?: { id: string; name: string; value: string; priceAdjustment?: number } | null,
    itemType: "PRODUCT" | "SERVICE" | "AD" = "PRODUCT"
  ) => {
    addToCart(item, qty, variant, itemType);
    setCartDrawerOpen(false);
    navigateTo("checkout");
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((c) =>
        c.cartItemId === cartItemId
          ? { ...c, quantity: Math.max(0, c.quantity + delta) }
          : c
      )
      .filter((c) => c.quantity > 0);
    saveCart(updated);
  };

  const removeFromCart = (cartItemId: string) => {
    saveCart(cart.filter((c) => c.cartItemId !== cartItemId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartShipping =
    cart.length === 0
      ? 0
      : freeShippingThreshold > 0 && cartSubtotal >= freeShippingThreshold
      ? 0
      : shippingFee;
  const cartTotal = cartSubtotal + cartShipping;

  // 1-Page Inquiry Modal State (also available on 6/12 page for quick inquiry)
  const [inquiryModalItem, setInquiryModalItem] = useState<any | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    quantity: 1,
    message: "",
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Detail Page State (Selected Image, Variant, Quantity, Review Form)
  const [selectedDetailImage, setSelectedDetailImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [localReviews, setLocalReviews] = useState<any[]>(siteData.websiteReviews || []);
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    customerEmail: "",
    rating: 5,
    comment: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedMsg, setReviewSubmittedMsg] = useState<string | null>(null);

  // Catalog Search & Category Filter
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Checkout State
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "Western",
    postalCode: "",
    notes: "",
    paymentMethod: codEnabled ? ("COD" as "COD" | "BANK_DEPOSIT") : ("BANK_DEPOSIT" as "COD" | "BANK_DEPOSIT"),
    bankReference: "",
  });
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const pages: any[] = config?.pages || [];
  const primaryColor = config?.primaryColor || "#E91E63";
  const hero = config?.heroSection || {};
  const about = config?.aboutSection || {};
  const services = config?.servicesSection || {};
  const gallery = config?.gallerySection || {};
  const reviews = config?.reviewsSection || {};
  const contact = config?.contactSection || {};
  const footer = config?.footerSection || {};

  const whatsappPhone = (contact.whatsapp || contact.phone || vendor?.phone || "").replace(
    /[^0-9]/g,
    ""
  );
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "#";
  const vendorEmail = contact.email || vendor?.email || vendor?.businessEmail || "";

  // Normalize Services List with IDs & Slugs
  const normalizedServices = useMemo(() => {
    const raw =
      services.items && services.items.length > 0
        ? services.items
        : products && products.length > 0 && entityType === "ADS_SELLER"
        ? products.slice(0, 6).map((p: any, idx: number) => ({
            id: p.id || `service-${idx}`,
            slug: p.slug || p.id || `service-${idx}`,
            name: p.title || p.name,
            price: p.price != null ? `Rs. ${Number(p.price).toLocaleString()}` : "Contact for price",
            numericPrice: p.price != null ? Number(p.price) : 0,
            imageUrl: p.image || p.images?.[0],
            description: p.description,
          }))
        : (services.items || []);

    return raw.map((s: any, idx: number) => ({
      ...s,
      id: s.id || `service-${idx + 1}`,
      slug:
        s.slug ||
        s.id ||
        (s.name ? s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `service-${idx + 1}`),
      numericPrice:
        typeof s.price === "number"
          ? s.price
          : parseFloat(String(s.price || "0").replace(/[^0-9.]/g, "")) || 0,
    }));
  }, [services.items, products, entityType]);

  // Reset detail state when activeItemSlug changes
  useEffect(() => {
    setSelectedDetailImage(null);
    setSelectedVariantId(null);
    setDetailQty(1);
    setReviewSubmittedMsg(null);
  }, [activeItemSlug, activePage]);

  // Navigation Items
  const defaultNavItems = [
    { id: "home", label: "Home", type: isMultiPage ? "page" : "scroll", target: "home", visible: true },
    {
      id: "services",
      label: "Services",
      type: isMultiPage ? "page" : "scroll",
      target: "services",
      visible: services.enabled !== false && normalizedServices.length > 0,
    },
    {
      id: "products",
      label: entityType === "ADS_SELLER" ? "My Ads" : "Products",
      type: isMultiPage ? "page" : "scroll",
      target: "products",
      visible: config?.productsSection?.enabled !== false,
    },
    { id: "about", label: "About", type: "scroll", target: "about", visible: about.enabled !== false },
    {
      id: "gallery",
      label: "Gallery",
      type: "scroll",
      target: "gallery",
      visible: Boolean(gallery.enabled) && Boolean(gallery.images && gallery.images.length > 0),
    },
    {
      id: "reviews",
      label: "Reviews",
      type: isMultiPage ? "page" : "scroll",
      target: "reviews",
      visible: true,
    },
    { id: "contact", label: "Contact", type: "scroll", target: "contact", visible: true },
  ];

  const rawNavItems: any[] =
    config?.navItemsJson && Array.isArray(config.navItemsJson) && config.navItemsJson.length > 0
      ? config.navItemsJson
      : defaultNavItems;

  const navItems = [...rawNavItems];
  defaultNavItems.forEach((def) => {
    const exists = navItems.some(
      (s: any) => s.id === def.id || (s.target === def.target && s.type === def.type)
    );
    if (!exists) {
      navItems.push(def);
    }
  });

  const visibleNavItems = navItems.filter((item: any) => {
    if (item.visible === false || item.visible === "false") return false;
    if (item.id === "gallery" && (!gallery.enabled || !gallery.images || gallery.images.length === 0)) {
      return false;
    }
    const isStandardTarget = ["home", "products", "services", "about", "gallery", "reviews", "contact"].includes(
      item.target
    );
    if (item.isCustom || (item.type === "page" && !isStandardTarget)) {
      const matchedPage = pages.find(
        (p: any) => p.slug === item.target || `custom-page-${p.id}` === item.id
      );
      if (!matchedPage) return false;
      if (!isPreview && matchedPage.isPublished === false) return false;
      if (matchedPage.sectionsJson?.showInNavbar === false) return false;
    }
    return true;
  });

  const handleNavItemClick = (item: any) => {
    setMobileMenuOpen(false);
    if (
      isMultiPage &&
      (item.target === "products" || item.target === "services" || item.target === "reviews" || item.type === "page")
    ) {
      navigateTo(item.target);
      return;
    }

    if (item.type === "page") {
      navigateTo(item.target);
      return;
    }

    // Smooth scroll on home page
    if (activePage !== "home") {
      navigateTo("home");
      setTimeout(() => {
        if (item.target === "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } else {
      if (item.target === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Inquiry Handlers (1-Page & Multi-Page Quick Inquiry)
  const openInquiryModal = (item: any, itemType: "PRODUCT" | "SERVICE" | "AD" = "PRODUCT") => {
    const title = item.title || item.name || "Item";
    const price =
      item.price != null && item.price !== ""
        ? typeof item.price === "number"
          ? `Rs. ${item.price.toLocaleString()}`
          : String(item.price)
        : "Contact for price";
    setInquiryModalItem({
      ...item,
      displayTitle: title,
      displayPrice: price,
      itemType,
    });
    setInquiryForm((prev) => ({
      ...prev,
      quantity: 1,
      message: `Hi, I would like to order / inquire about "${title}" (${price}). Please let me know availability and payment details.`,
    }));
    setInquirySuccess(false);
  };

  const handleInquirySubmitDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.customerName.trim() || (!inquiryForm.customerPhone.trim() && !inquiryForm.customerEmail.trim())) {
      alert("Please enter your name and phone number or email.");
      return;
    }
    setIsSubmittingInquiry(true);
    try {
      const res = await fetch(`/api/site/${domainOrSlug}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: inquiryForm.customerName,
          customerPhone: inquiryForm.customerPhone,
          customerEmail: inquiryForm.customerEmail,
          quantity: inquiryForm.quantity,
          message: inquiryForm.message,
          itemType: inquiryModalItem?.itemType || "PRODUCT",
          itemId: inquiryModalItem?.id || inquiryModalItem?.slug,
          itemName: inquiryModalItem?.displayTitle,
          itemPrice: inquiryModalItem?.displayPrice,
          preferredChannel: "DIRECT",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInquirySuccess(true);
      } else {
        alert(data.error || "Failed to send inquiry");
      }
    } catch {
      alert("Failed to send inquiry. Please try WhatsApp or Email.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleInquiryViaWhatsApp = (item?: any) => {
    const target = item || inquiryModalItem;
    const title = target?.displayTitle || target?.title || target?.name || "your offerings";
    const price =
      target?.displayPrice ||
      (target?.price != null
        ? typeof target.price === "number"
          ? `Rs. ${target.price.toLocaleString()}`
          : String(target.price)
        : "");
    const qty = inquiryForm.quantity || 1;
    const customerDetails = inquiryForm.customerName
      ? `\nName: ${inquiryForm.customerName}\nPhone: ${inquiryForm.customerPhone || "N/A"}`
      : "";
    const text = encodeURIComponent(
      `Hello ${vendor?.businessName || "Store"},\nI would like to order / inquire about:\n• Item: ${title}${
        price ? ` (${price})` : ""
      }\n• Quantity: ${qty}${customerDetails}\n\n${
        inquiryForm.message || "Please share availability and order details."
      }`
    );
    if (whatsappPhone) {
      window.open(`https://wa.me/${whatsappPhone}?text=${text}`, "_blank");
    } else {
      alert("WhatsApp number not configured for this store. Please use the inquiry form or email.");
    }
  };

  const handleInquiryViaEmail = (item?: any) => {
    const target = item || inquiryModalItem;
    const title = target?.displayTitle || target?.title || target?.name || "Product/Service Inquiry";
    const price =
      target?.displayPrice ||
      (target?.price != null
        ? typeof target.price === "number"
          ? `Rs. ${target.price.toLocaleString()}`
          : String(target.price)
        : "");
    const subject = encodeURIComponent(`Order / Inquiry: ${title} - ${vendor?.businessName || "Store"}`);
    const body = encodeURIComponent(
      `Hello ${vendor?.businessName || "Store"},\n\nI would like to inquire about / order:\nItem: ${title} ${
        price ? `(${price})` : ""
      }\nQuantity: ${inquiryForm.quantity || 1}\nName: ${inquiryForm.customerName || ""}\nPhone: ${
        inquiryForm.customerPhone || ""
      }\n\nMessage:\n${inquiryForm.message || "Please let me know how to proceed with this order."}`
    );
    if (vendorEmail) {
      window.location.href = `mailto:${vendorEmail}?subject=${subject}&body=${body}`;
    } else {
      openInquiryModal(target);
    }
  };

  // Click handler for any Product / Service / Ad card
  const handleItemCardClick = (item: any, itemType: "PRODUCT" | "SERVICE" | "AD" = "PRODUCT") => {
    if (isMultiPage) {
      const slugOrId = item.slug || item.id || item.name;
      if (itemType === "SERVICE") {
        navigateTo("service", slugOrId);
      } else if (itemType === "AD" || item.type === "AD") {
        navigateTo("ad", slugOrId);
      } else {
        navigateTo("product", slugOrId);
      }
    } else {
      // On 1-Page Website, clicking opens the WhatsApp / Email / Direct Inquiry Modal
      openInquiryModal(item, itemType);
    }
  };

  // Submit Review on Standalone Website
  const handleReviewSubmit = async (e: React.FormEvent, targetItem?: any, itemType = "PRODUCT") => {
    e.preventDefault();
    if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) {
      alert("Please enter your name and review comment.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/site/${domainOrSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: reviewForm.customerName,
          customerEmail: reviewForm.customerEmail,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          itemId: targetItem?.id || targetItem?.slug || null,
          itemName: targetItem?.title || targetItem?.name || vendor?.businessName || "Store",
          itemImage: targetItem?.image || targetItem?.imageUrl || targetItem?.images?.[0] || null,
          itemType,
          productSlug: targetItem?.slug || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalReviews((prev) => [data.data, ...prev]);
        setReviewForm({ customerName: "", customerEmail: "", rating: 5, comment: "" });
        setReviewSubmittedMsg("Thank you! Your review has been published.");
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch {
      alert("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Upload Bank Slip on Checkout
  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSlip(true);
    setCheckoutError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/site/${domainOrSlug}/upload-slip`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSlipUrl(data.data.url);
      } else {
        setCheckoutError(data.error || "Failed to upload bank slip");
      }
    } catch {
      setCheckoutError("Error uploading bank slip");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  // Place Order on Checkout
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setCheckoutError("Your cart is empty");
      return;
    }
    if (
      !checkoutForm.fullName.trim() ||
      !checkoutForm.phone.trim() ||
      !checkoutForm.addressLine1.trim() ||
      !checkoutForm.city.trim()
    ) {
      setCheckoutError("Please fill in your Full Name, Phone Number, Street Address, and City.");
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutError(null);
    try {
      const res = await fetch(`/api/site/${domainOrSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          shippingAddress: {
            fullName: checkoutForm.fullName,
            phone: checkoutForm.phone,
            email: checkoutForm.email,
            addressLine1: checkoutForm.addressLine1,
            addressLine2: checkoutForm.addressLine2,
            city: checkoutForm.city,
            province: checkoutForm.province,
            postalCode: checkoutForm.postalCode,
          },
          paymentMethod: checkoutForm.paymentMethod,
          paymentSlipUrl,
          bankReference: checkoutForm.bankReference,
          notes: checkoutForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlacedOrder({
          ...data.data,
          items: [...cart],
          shippingAddress: { ...checkoutForm },
        });
        saveCart([]);
        navigateTo("order-success");
      } else {
        setCheckoutError(data.error || "Failed to place order");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Categories from products
  const productCategories = useMemo(() => {
    const map = new Map<string, string>();
    (products || []).forEach((p: any) => {
      if (p.category?.slug && p.category?.name) {
        map.set(p.category.slug, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p: any) => {
      if (selectedCategory !== "all" && p.category?.slug !== selectedCategory) {
        return false;
      }
      if (!catalogSearch.trim()) return true;
      const term = catalogSearch.toLowerCase();
      const title = (p.title || p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return title.includes(term) || desc.includes(term);
    });
  }, [products, selectedCategory, catalogSearch]);

  // Lookup active Product / Service / Ad for Detail Pages
  const activeProduct = useMemo(() => {
    if (!activeItemSlug) return products?.[0] || null;
    return (
      (products || []).find(
        (p: any) =>
          p.slug === activeItemSlug ||
          p.id === activeItemSlug ||
          String(p.name).toLowerCase() === String(activeItemSlug).toLowerCase()
      ) || null
    );
  }, [products, activeItemSlug]);

  const activeService = useMemo(() => {
    if (!activeItemSlug) return normalizedServices?.[0] || null;
    return (
      normalizedServices.find(
        (s: any) =>
          s.slug === activeItemSlug ||
          s.id === activeItemSlug ||
          String(s.name).toLowerCase() === String(activeItemSlug).toLowerCase()
      ) || null
    );
  }, [normalizedServices, activeItemSlug]);

  const requestedCustomPage = useMemo(() => {
    if (!activePage || activePage === "home") return null;
    return pages.find((p: any) => p.slug === activePage) || null;
  }, [pages, activePage]);

  const productNavItem = navItems.find((ni: any) => ni.target === "products");
  const catalogTitle =
    productNavItem?.label ||
    config?.productsSection?.title ||
    (entityType === "ADS_SELLER" ? "My Ads & Listings" : "Store Products");

  // Reusable Product / Ad Card Renderer
  const renderProductCard = (p: any, idx: number) => {
    const title = p.title || p.name || `Item #${idx + 1}`;
    const numericPrice = p.price != null && p.price !== "" ? Number(p.price) : null;
    const priceLabel =
      numericPrice != null
        ? `Rs. ${numericPrice.toLocaleString()}`
        : p.type === "AD"
        ? "Contact for price"
        : "Rs. 0";
    const compareAt = p.compareAtPrice ? Number(p.compareAtPrice) : null;
    const img =
      p.image ||
      p.images?.[0]?.url ||
      (typeof p.images?.[0] === "string" ? p.images[0] : null);
    const isAd = p.type === "AD" || entityType === "ADS_SELLER";

    return (
      <div
        key={p.id || idx}
        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
      >
        <div
          onClick={() => handleItemCardClick(p, isAd ? "AD" : "PRODUCT")}
          className="cursor-pointer"
        >
          <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden mb-3 flex items-center justify-center">
            {img ? (
              <Image
                src={img}
                alt={title}
                fill
                className="object-contain object-center p-2 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-10 h-10" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
              <span className="bg-black/70 backdrop-blur-md text-[9px] uppercase font-black text-white px-2.5 py-0.5 rounded-full">
                {isAd ? "Verified Ad" : p.stock === 0 ? "Out of Stock" : "In Stock"}
              </span>
              {compareAt && numericPrice && compareAt > numericPrice && (
                <span className="bg-rose-600 text-[9px] uppercase font-black text-white px-2 py-0.5 rounded-full">
                  {Math.round(((compareAt - numericPrice) / compareAt) * 100)}% OFF
                </span>
              )}
            </div>
          </div>

          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:underline">
            {title}
          </h4>
          {p.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-sm font-black text-slate-900">{priceLabel}</span>
              {compareAt && numericPrice && compareAt > numericPrice && (
                <span className="text-[11px] text-slate-400 line-through ml-1.5">
                  Rs. {compareAt.toLocaleString()}
                </span>
              )}
            </div>
            {isMultiPage && (
              <button
                type="button"
                onClick={() => handleItemCardClick(p, isAd ? "AD" : "PRODUCT")}
                className="text-[11px] font-bold hover:underline flex items-center gap-0.5"
                style={{ color: primaryColor }}
              >
                <span>View Details</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {isMultiPage ? (
            !isAd && numericPrice != null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p, 1, null, "PRODUCT")}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-[11px] inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </button>
                <button
                  type="button"
                  disabled={p.stock === 0}
                  onClick={() => handleBuyNow(p, 1, null, "PRODUCT")}
                  className="py-2 px-2.5 rounded-xl text-white font-bold text-[11px] shadow-sm hover:opacity-90 inline-flex items-center justify-center gap-1 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Buy Now</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleItemCardClick(p, "AD")}
                className="w-full py-2 px-3 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-90 inline-flex items-center justify-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">View Details &amp; Order</span>
              </button>
            )
          ) : (
            /* 1-Page Website Mode: Order / Buy via WhatsApp, Email, or Inquiry */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleInquiryViaWhatsApp(p)}
                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => openInquiryModal(p, isAd ? "AD" : "PRODUCT")}
                className="py-2 px-2.5 rounded-xl text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 shadow-xs hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Inquire</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Reusable Service Card Renderer
  const renderServiceCard = (s: any, idx: number) => {
    return (
      <div
        key={s.id || idx}
        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
      >
        <div
          onClick={() => handleItemCardClick(s, "SERVICE")}
          className="cursor-pointer"
        >
          <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden mb-3 flex items-center justify-center">
            {s.imageUrl ? (
              <Image
                src={s.imageUrl}
                alt={s.name}
                fill
                className="object-contain object-center p-2 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center">
                <Sparkles className="w-8 h-8 mb-1 opacity-50" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Service Package</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:underline line-clamp-2">
              {s.name}
            </h3>
            {s.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
            )}
            <p className="text-sm font-black mt-2" style={{ color: primaryColor }}>
              {s.price}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          {isMultiPage ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleItemCardClick(s, "SERVICE")}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => openInquiryModal(s, "SERVICE")}
                className="py-2.5 px-3 rounded-xl text-white text-xs font-black shadow-sm hover:opacity-90 inline-flex items-center justify-center gap-1"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Book / Order</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleInquiryViaWhatsApp(s)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => openInquiryModal(s, "SERVICE")}
                className="py-2.5 px-3 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-1 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Inquire</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-white text-slate-900 selection:bg-rose-100 selection:text-rose-900"
      style={{ fontFamily: config?.fontFamily || "Inter, sans-serif" }}
    >
      {/* Floating Cart Toast */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{cartToast}</span>
          {isMultiPage && (
            <button
              type="button"
              onClick={() => navigateTo("cart")}
              className="ml-2 px-3 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-black"
            >
              View Cart ({cartCount})
            </button>
          )}
        </div>
      )}

      {/* ── Standalone Vendor Header (Responsive Desktop, Tablet & Mobile with Right-Corner Hamburger Menu) ── */}
      <header className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Store Logo & Brand Name (Clean single-line alignment on all screens) */}
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className="flex items-center gap-2.5 sm:gap-3 text-left min-w-0 flex-1 lg:flex-initial"
          >
            {vendor?.logo ? (
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border shadow-sm shrink-0">
                <Image src={vendor.logo} alt="Logo" fill className="object-cover" />
              </div>
            ) : (
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {vendor?.businessName?.charAt(0) || "S"}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-lg lg:text-xl tracking-tight block truncate leading-tight text-slate-900">
                {vendor?.businessName || "Store"}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-slate-400 block truncate mt-0.5">
                {isMultiPage ? "Official Online Store" : "Direct Inquiry Storefront"}
              </span>
            </div>
          </button>

          {/* Center: Desktop / Tablet Navigation Links */}
          <nav
            className={`${
              isPreview
                ? previewDevice === "mobile"
                  ? "hidden"
                  : "flex"
                : "hidden md:flex"
            } flex-wrap items-center justify-center gap-3.5 lg:gap-5 xl:gap-6 text-sm font-semibold text-slate-600`}
          >
            {visibleNavItems.map((item: any) => {
              const isCurrent =
                activePage === item.target ||
                (activePage === "home" && item.target === "home");

              return (
                <button
                  key={item.id || item.target}
                  type="button"
                  onClick={() => handleNavItemClick(item)}
                  className={`transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                    isCurrent ? "font-extrabold" : "hover:text-black text-slate-600"
                  }`}
                  style={{ color: isCurrent ? primaryColor : undefined }}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Custom Multi-Pages enabled for Navbar */}
            {pages
              .filter((p: any) => {
                if (!isPreview && p.isPublished === false) return false;
                if (p.sectionsJson?.showInNavbar === false) return false;
                const excluded = navItems.some(
                  (ni: any) =>
                    (ni.target === p.slug || ni.id === `custom-page-${p.id}`) &&
                    (ni.visible === false || ni.visible === "false")
                );
                if (excluded) return false;
                return !visibleNavItems.some(
                  (ni: any) => ni.target === p.slug || ni.id === `custom-page-${p.id}`
                );
              })
              .map((p: any) => {
                const isCurrent = activePage === p.slug;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => navigateTo(p.slug)}
                    className={`transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                      isCurrent ? "font-extrabold" : "hover:text-black text-slate-600"
                    }`}
                    style={{ color: isCurrent ? primaryColor : undefined }}
                  >
                    {p.title}
                  </button>
                );
              })}
          </nav>

          {/* Right: Cart + CTA + Far-Right Hamburger Menu Button on Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isMultiPage && (
              <button
                type="button"
                onClick={() => navigateTo("cart")}
                className="relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-900 font-bold text-xs transition-all"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                <span className="hidden md:inline">Cart</span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-black text-white leading-none"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </span>
              </button>
            )}

            {/* Desktop & Tablet Primary CTA Button (hidden on small mobile where it lives in the Hamburger menu & Hero) */}
            <button
              type="button"
              onClick={() =>
                isMultiPage
                  ? handleInquiryViaWhatsApp()
                  : openInquiryModal({ name: vendor?.businessName || "General Inquiry" }, "PRODUCT")
              }
              className={`${
                isPreview && previewDevice === "mobile" ? "hidden" : "hidden sm:inline-flex"
              } items-center gap-2 px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity whitespace-nowrap`}
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{config?.headerSection?.buttonText || "WhatsApp / Inquire"}</span>
            </button>

            {/* Hamburger Menu Button at the Far Right Corner (Mobile View) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`${
                isPreview
                  ? previewDevice === "mobile"
                    ? "inline-flex"
                    : "hidden"
                  : "md:hidden inline-flex"
              } items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors shrink-0`}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Slide-Down Navigation Menu ── */}
        {mobileMenuOpen && (
          <div
            className={`${
              isPreview ? (previewDevice === "mobile" ? "block" : "hidden") : "md:hidden"
            } border-t border-slate-200 bg-white shadow-2xl px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2`}
          >
            <div className="flex flex-col space-y-1">
              {visibleNavItems.map((item: any) => {
                const isCurrent =
                  activePage === item.target ||
                  (activePage === "home" && item.target === "home");

                return (
                  <button
                    key={item.id || item.target}
                    type="button"
                    onClick={() => handleNavItemClick(item)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                      isCurrent
                        ? "text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    style={{ backgroundColor: isCurrent ? primaryColor : undefined }}
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 ${isCurrent ? "text-white" : "text-slate-400"}`}
                    />
                  </button>
                );
              })}

              {/* Custom Multi-Pages in Mobile Menu */}
              {pages
                .filter((p: any) => {
                  if (!isPreview && p.isPublished === false) return false;
                  if (p.sectionsJson?.showInNavbar === false) return false;
                  const excluded = navItems.some(
                    (ni: any) =>
                      (ni.target === p.slug || ni.id === `custom-page-${p.id}`) &&
                      (ni.visible === false || ni.visible === "false")
                  );
                  if (excluded) return false;
                  return !visibleNavItems.some(
                    (ni: any) => ni.target === p.slug || ni.id === `custom-page-${p.id}`
                  );
                })
                .map((p: any) => {
                  const isCurrent = activePage === p.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => navigateTo(p.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                        isCurrent
                          ? "text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      style={{ backgroundColor: isCurrent ? primaryColor : undefined }}
                    >
                      <span>{p.title}</span>
                      <ChevronRight
                        className={`w-4 h-4 ${isCurrent ? "text-white" : "text-slate-400"}`}
                      />
                    </button>
                  );
                })}
            </div>

            {/* Mobile Menu Bottom Action Buttons */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {isMultiPage && (
                <button
                  type="button"
                  onClick={() => navigateTo("cart")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>Shopping Cart ({cartCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isMultiPage) {
                    handleInquiryViaWhatsApp();
                  } else {
                    openInquiryModal(
                      { name: vendor?.businessName || "General Inquiry" },
                      "PRODUCT"
                    );
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>{config?.headerSection?.buttonText || "WhatsApp / Inquire"}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── PAGE ROUTER: PRODUCT DETAIL / SERVICE DETAIL / AD DETAIL / CART / CHECKOUT / ORDER SUCCESS / CATALOG / SERVICES / REVIEWS / CUSTOM PAGE / HOME ── */}
      {activePage === "product" || activePage === "ad" ? (
        /* ── DEDICATED PRODUCT / AD DETAILS PAGE (6-Page / 12-Page Website) ── */
        <div className="pb-20">
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <button onClick={() => navigateTo("home")} className="hover:text-slate-900">
                  Home
                </button>
                <span>/</span>
                <button onClick={() => navigateTo("products")} className="hover:text-slate-900">
                  {catalogTitle}
                </button>
                <span>/</span>
                <span className="text-slate-900 font-bold line-clamp-1">
                  {activeProduct?.title || activeProduct?.name || "Item Details"}
                </span>
              </div>
              <button
                onClick={() => navigateTo("products")}
                className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-black"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {catalogTitle}</span>
              </button>
            </div>
          </div>

          {activeProduct ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Image Gallery */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="aspect-square rounded-3xl bg-slate-50 border overflow-hidden relative shadow-sm flex items-center justify-center">
                    {selectedDetailImage ||
                    activeProduct.image ||
                    activeProduct.images?.[0] ? (
                      <Image
                        src={
                          selectedDetailImage ||
                          activeProduct.image ||
                          (typeof activeProduct.images?.[0] === "string"
                            ? activeProduct.images[0]
                            : activeProduct.images?.[0]?.url)
                        }
                        alt={activeProduct.name || "Product"}
                        fill
                        className="object-contain object-center p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-16 h-16" />
                      </div>
                    )}
                  </div>

                  {Array.isArray(activeProduct.images) && activeProduct.images.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {activeProduct.images.map((imgItem: any, i: number) => {
                        const url = typeof imgItem === "string" ? imgItem : imgItem?.url;
                        if (!url) return null;
                        const isSelected =
                          (selectedDetailImage || activeProduct.image) === url;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedDetailImage(url)}
                            className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-slate-50 shrink-0 transition-all ${
                              isSelected ? "scale-105 shadow-md" : "opacity-70 hover:opacity-100"
                            }`}
                            style={{ borderColor: isSelected ? primaryColor : "transparent" }}
                          >
                            <Image src={url} alt="Thumbnail" fill className="object-contain object-center p-1" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Product Info, Variants, Add to Cart & Buy Now */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {activeProduct.type === "AD" ? "Verified Classified Ad" : "Official Store Product"}
                      </span>
                      {activeProduct.category?.name && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {activeProduct.category.name}
                        </span>
                      )}
                      {activeProduct.stock > 0 ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock ({activeProduct.stock} available)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {activeProduct.title || activeProduct.name}
                    </h1>

                    {/* Rating Summary */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        {activeProduct.averageRating || "5.0"} (
                        {
                          localReviews.filter(
                            (r) =>
                              r.itemId === activeProduct.id ||
                              r.productSlug === activeProduct.slug
                          ).length
                        }{" "}
                        reviews)
                      </span>
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="p-5 rounded-2xl bg-slate-50 border space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="text-3xl font-black"
                        style={{ color: primaryColor }}
                      >
                        {activeProduct.price != null
                          ? `Rs. ${(
                              Number(activeProduct.price) +
                              Number(
                                activeProduct.variants?.find(
                                  (v: any) => v.id === selectedVariantId
                                )?.priceAdjustment || 0
                              )
                            ).toLocaleString()}`
                          : "Contact for Price"}
                      </span>
                      {activeProduct.compareAtPrice &&
                        Number(activeProduct.compareAtPrice) > Number(activeProduct.price) && (
                          <span className="text-base text-slate-400 line-through font-semibold">
                            Rs. {Number(activeProduct.compareAtPrice).toLocaleString()}
                          </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {codEnabled && bankDepositEnabled
                        ? "Cash on Delivery (COD) & Bank Deposit Available"
                        : codEnabled
                        ? "Cash on Delivery (COD) Available"
                        : "Bank Deposit Available"}{" "}
                      • {deliveryEstimate}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Description &amp; Details
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {activeProduct.description || "High quality product available directly from our store."}
                    </p>
                  </div>

                  {/* Classified Ad Specifications if present */}
                  {activeProduct.specifications &&
                    typeof activeProduct.specifications === "object" &&
                    Object.keys(activeProduct.specifications).length > 0 && (
                      <div className="p-4 rounded-2xl border bg-slate-50/60 space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(activeProduct.specifications).map(([k, v]: any) => (
                            <div key={k} className="flex justify-between border-b pb-1">
                              <span className="text-slate-500 capitalize">{k}:</span>
                              <span className="font-bold text-slate-900">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Variants Selection */}
                  {Array.isArray(activeProduct.variants) && activeProduct.variants.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                        Select Option / Variant
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {activeProduct.variants.map((v: any) => {
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariantId(v.id)}
                              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                                isSelected
                                  ? "text-white shadow-sm"
                                  : "bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                              style={{
                                backgroundColor: isSelected ? primaryColor : undefined,
                                borderColor: isSelected ? primaryColor : undefined,
                              }}
                            >
                              {v.name}: {v.value}
                              {v.priceAdjustment
                                ? ` (${v.priceAdjustment > 0 ? "+" : ""}Rs. ${v.priceAdjustment})`
                                : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Primary Purchase Buttons */}
                  {isMultiPage && activeProduct.price != null ? (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Quantity
                        </span>
                        <div className="inline-flex items-center border rounded-xl bg-white">
                          <button
                            type="button"
                            onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                            className="p-2.5 text-slate-600 hover:text-black"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-black text-sm">{detailQty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDetailQty((q) =>
                                Math.min(activeProduct.stock || 99, q + 1)
                              )
                            }
                            className="p-2.5 text-slate-600 hover:text-black"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={activeProduct.stock === 0}
                          onClick={() => {
                            const chosenVariant = activeProduct.variants?.find(
                              (v: any) => v.id === selectedVariantId
                            );
                            addToCart(
                              activeProduct,
                              detailQty,
                              chosenVariant,
                              activeProduct.type === "AD" ? "AD" : "PRODUCT"
                            );
                          }}
                          className="py-4 px-6 rounded-2xl border-2 font-black text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>

                        <button
                          type="button"
                          disabled={activeProduct.stock === 0}
                          onClick={() => {
                            const chosenVariant = activeProduct.variants?.find(
                              (v: any) => v.id === selectedVariantId
                            );
                            handleBuyNow(
                              activeProduct,
                              detailQty,
                              chosenVariant,
                              activeProduct.type === "AD" ? "AD" : "PRODUCT"
                            );
                          }}
                          className="py-4 px-6 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg hover:opacity-95 inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Zap className="w-4 h-4" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Inquiry / WhatsApp / Email Options */}
                  <div className="pt-3 border-t flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleInquiryViaWhatsApp(activeProduct)}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order / Ask on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openInquiryModal(activeProduct, "PRODUCT")}
                      className="py-3 px-4 rounded-xl border bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email / Direct Inquiry</span>
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t text-center">
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <Truck className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                      <p className="text-[10px] font-bold text-slate-700">Islandwide Delivery</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <CreditCard className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                      <p className="text-[10px] font-bold text-slate-700">COD &amp; Bank Deposit</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                      <ShieldCheck className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                      <p className="text-[10px] font-bold text-slate-700">Verified Seller</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Product Reviews & Write a Review Section ── */}
              <div className="border-t pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span
                      className="text-xs font-black uppercase tracking-widest"
                      style={{ color: primaryColor }}
                    >
                      VERIFIED FEEDBACK
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">
                      Customer Reviews for {activeProduct.title || activeProduct.name}
                    </h2>
                  </div>

                  {localReviews.filter(
                    (r) =>
                      r.itemId === activeProduct.id ||
                      r.productSlug === activeProduct.slug
                  ).length > 0 ? (
                    <div className="space-y-4">
                      {localReviews
                        .filter(
                          (r) =>
                            r.itemId === activeProduct.id ||
                            r.productSlug === activeProduct.slug
                        )
                        .map((rev: any, idx: number) => (
                          <div
                            key={rev.id || idx}
                            className="p-5 rounded-2xl border bg-white shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {rev.customerName || "Customer"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                  Verified Website Review
                                </span>
                              </div>
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < (rev.rating || 5)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                            {rev.vendorReply && (
                              <div className="mt-3 p-3 rounded-xl bg-slate-50 border-l-4 text-xs space-y-1" style={{ borderColor: primaryColor }}>
                                <p className="font-black text-slate-900">
                                  Reply from {vendor?.businessName}:
                                </p>
                                <p className="text-slate-600">{rev.vendorReply}</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border bg-slate-50/50 text-center space-y-2">
                      <Star className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="font-bold text-sm text-slate-800">No reviews yet for this item</p>
                      <p className="text-xs text-slate-500">
                        Be the first to share your experience with this product!
                      </p>
                    </div>
                  )}
                </div>

                {/* Write a Review Form */}
                <div className="lg:col-span-5">
                  <form
                    onSubmit={(e) => handleReviewSubmit(e, activeProduct, "PRODUCT")}
                    className="p-6 rounded-3xl border bg-slate-50/70 space-y-4"
                  >
                    <h3 className="font-black text-lg text-slate-900">Write a Review</h3>
                    {reviewSubmittedMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{reviewSubmittedMsg}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="p-1"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewForm.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewForm.customerName}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, customerName: e.target.value })
                        }
                        placeholder="e.g. Nimali Perera"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Your Review <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, comment: e.target.value })
                        }
                        placeholder="Share your feedback about this product..."
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Related Products */}
              {products.length > 1 && (
                <div className="border-t pt-10 sm:pt-12 space-y-6">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">More From {vendor?.businessName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products
                      .filter((p: any) => p.id !== activeProduct.id)
                      .slice(0, 4)
                      .map((p: any, idx: number) => renderProductCard(p, idx))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <h2 className="text-2xl font-black text-slate-800">Item Not Found</h2>
              <button
                onClick={() => navigateTo("products")}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Browse All Products
              </button>
            </div>
          )}
        </div>
      ) : activePage === "service" ? (
        /* ── DEDICATED SERVICE DETAILS PAGE (6-Page / 12-Page Website) ── */
        <div className="pb-20">
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <button onClick={() => navigateTo("home")} className="hover:text-slate-900">
                  Home
                </button>
                <span>/</span>
                <button onClick={() => navigateTo("services")} className="hover:text-slate-900">
                  {services.title || "Services"}
                </button>
                <span>/</span>
                <span className="text-slate-900 font-bold">
                  {activeService?.name || "Service Details"}
                </span>
              </div>
              <button
                onClick={() => navigateTo("services")}
                className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-black"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Services</span>
              </button>
            </div>
          </div>

          {activeService ? (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-6">
                  <div className="aspect-square sm:aspect-[4/3] rounded-3xl bg-slate-50 border overflow-hidden relative shadow-lg flex items-center justify-center">
                    {activeService.imageUrl ? (
                      <Image
                        src={activeService.imageUrl}
                        alt={activeService.name}
                        fill
                        className="object-contain object-center p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Sparkles className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    PROFESSIONAL SERVICE PACKAGE
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                    {activeService.name}
                  </h1>
                  <div className="p-5 rounded-2xl bg-slate-50 border">
                    <span className="text-xs font-bold uppercase text-slate-400 block">
                      Service Rate / Package Price
                    </span>
                    <span className="text-3xl font-black" style={{ color: primaryColor }}>
                      {activeService.price || "Contact for Quote"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeService.description ||
                      `Book our professional ${activeService.name} package with personalized care from ${vendor?.businessName}.`}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {activeService.numericPrice > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => addToCart(activeService, 1, null, "SERVICE")}
                          className="py-3.5 px-5 rounded-2xl border-2 font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add Service to Cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBuyNow(activeService, 1, null, "SERVICE")}
                          className="py-3.5 px-5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg inline-flex items-center justify-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Zap className="w-4 h-4" />
                          <span>Book &amp; Checkout Now</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleInquiryViaWhatsApp(activeService)}
                      className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Book via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openInquiryModal(activeService, "SERVICE")}
                      className="py-3.5 px-5 rounded-2xl border bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Booking Inquiry</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : activePage === "cart" ? (
        /* ── DEDICATED SHOPPING CART PAGE (6-Page / 12-Page Website) ── */
        <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Your Shopping Cart</h1>
              <p className="text-xs text-slate-500 mt-1">
                Review your selected items before proceeding to checkout
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("products")}
              className="text-xs font-bold inline-flex items-center gap-1.5 hover:underline"
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-20 text-center border rounded-3xl bg-slate-50/50 space-y-4">
              <ShoppingCart className="w-14 h-14 text-slate-300 mx-auto" />
              <h3 className="text-xl font-black text-slate-800">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore our products and services and add items to your cart to place an order.
              </p>
              <button
                type="button"
                onClick={() => navigateTo("products")}
                className="px-6 py-3 rounded-full text-white font-bold text-xs shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-4 sm:p-5 rounded-2xl border bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-slate-50 relative overflow-hidden border shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-contain object-center p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.itemType}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{item.name}</h4>
                        {item.variantLabel && (
                          <p className="text-xs text-slate-500">{item.variantLabel}</p>
                        )}
                        <p className="text-xs font-extrabold mt-1" style={{ color: primaryColor }}>
                          Rs. {item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="inline-flex items-center border rounded-xl bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartItemId, -1)}
                          className="p-2 text-slate-600 hover:text-black"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartItemId, 1)}
                          className="p-2 text-slate-600 hover:text-black"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[95px]">
                        <span className="text-sm font-black text-slate-900">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-4 p-6 rounded-3xl border bg-slate-50/70 space-y-5 sticky top-28">
                <h3 className="font-black text-lg text-slate-900">Order Summary</h3>
                <div className="space-y-2.5 text-xs border-b pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal ({cartCount} items)</span>
                    <span className="font-bold text-slate-900">
                      Rs. {cartSubtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Charge</span>
                    <span className="font-bold text-slate-900">
                      {cartShipping === 0 ? "FREE" : `Rs. ${cartShipping.toLocaleString()}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-slate-900">Total</span>
                  <span className="text-2xl font-black" style={{ color: primaryColor }}>
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("checkout")}
                  className="w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activePage === "checkout" ? (
        /* ── DEDICATED CHECKOUT PAGE (COD & BANK DEPOSIT) ── */
        <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 pb-4 border-b flex items-center justify-between">
            <div>
              <span
                className="text-[11px] font-black uppercase tracking-widest"
                style={{ color: primaryColor }}
              >
                SECURE DIRECT CHECKOUT
              </span>
              <h1 className="text-3xl font-black text-slate-900">Complete Your Order</h1>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("cart")}
              className="text-xs font-bold text-slate-600 hover:text-black inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cart</span>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-16 text-center border rounded-3xl bg-slate-50 space-y-4">
              <p className="font-bold text-base text-slate-700">Your cart is currently empty.</p>
              <button
                type="button"
                onClick={() => navigateTo("products")}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Customer & Delivery Information */}
                <div className="p-6 rounded-3xl border bg-white shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b">
                    <Truck className="w-5 h-5" style={{ color: primaryColor }} />
                    <h3 className="font-black text-base text-slate-900">
                      1. Delivery &amp; Contact Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.fullName}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, fullName: e.target.value })
                        }
                        placeholder="e.g. Kasun Perera"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Phone / WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, phone: e.target.value })
                        }
                        placeholder="e.g. 0771234567"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Street Address / House No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.addressLine1}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, addressLine1: e.target.value })
                        }
                        placeholder="No. 45, Galle Road..."
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.city}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, city: e.target.value })
                        }
                        placeholder="e.g. Colombo / Kandy"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Postal Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={checkoutForm.postalCode}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })
                        }
                        placeholder="e.g. 10100"
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Order Notes / Delivery Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={checkoutForm.notes}
                        onChange={(e) =>
                          setCheckoutForm({ ...checkoutForm, notes: e.target.value })
                        }
                        placeholder="Any special instructions for your order or delivery..."
                        className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method: COD or Bank Deposit */}
                <div className="p-6 rounded-3xl border bg-white shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b">
                    <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                    <h3 className="font-black text-base text-slate-900">
                      2. Select Payment Method
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {codEnabled && (
                      <div
                        onClick={() =>
                          setCheckoutForm({ ...checkoutForm, paymentMethod: "COD" })
                        }
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1 ${
                          checkoutForm.paymentMethod === "COD"
                            ? "bg-slate-50 shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{
                          borderColor:
                            checkoutForm.paymentMethod === "COD" ? primaryColor : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900">
                            Cash on Delivery (COD)
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              checkoutForm.paymentMethod === "COD"
                                ? "text-white"
                                : "border-slate-300"
                            }`}
                            style={{
                              backgroundColor:
                                checkoutForm.paymentMethod === "COD" ? primaryColor : undefined,
                            }}
                          >
                            {checkoutForm.paymentMethod === "COD" && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Pay in cash when your order is delivered to your doorstep.
                        </p>
                      </div>
                    )}

                    {bankDepositEnabled && (
                      <div
                        onClick={() =>
                          setCheckoutForm({ ...checkoutForm, paymentMethod: "BANK_DEPOSIT" })
                        }
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1 ${
                          checkoutForm.paymentMethod === "BANK_DEPOSIT"
                            ? "bg-slate-50 shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{
                          borderColor:
                            checkoutForm.paymentMethod === "BANK_DEPOSIT"
                              ? primaryColor
                              : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900">
                            Bank Deposit / Transfer
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              checkoutForm.paymentMethod === "BANK_DEPOSIT"
                                ? "text-white"
                                : "border-slate-300"
                            }`}
                            style={{
                              backgroundColor:
                                checkoutForm.paymentMethod === "BANK_DEPOSIT"
                                  ? primaryColor
                                  : undefined,
                            }}
                          >
                            {checkoutForm.paymentMethod === "BANK_DEPOSIT" && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Transfer to our bank account &amp; upload the receipt/slip.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bank Deposit Details & Slip Upload */}
                  {checkoutForm.paymentMethod === "BANK_DEPOSIT" && (
                    <div className="p-5 rounded-2xl bg-slate-50 border space-y-4 mt-3">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Store Bank Account Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3.5 rounded-xl border">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Bank Name
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {bankDetails.bankName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Account Holder
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {bankDetails.accountName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Account Number
                            </span>
                            <span className="font-black text-slate-900">
                              {bankDetails.accountNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Branch
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {bankDetails.branch}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Transfer Reference No. (Optional)
                          </label>
                          <input
                            type="text"
                            value={checkoutForm.bankReference}
                            onChange={(e) =>
                              setCheckoutForm({
                                ...checkoutForm,
                                bankReference: e.target.value,
                              })
                            }
                            placeholder="e.g. REF-982341"
                            className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Upload Bank Slip / Receipt
                          </label>
                          <label className="cursor-pointer w-full px-3 py-2 rounded-xl border bg-white hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2">
                            {isUploadingSlip ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : paymentSlipUrl ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-emerald-700">Slip Uploaded! Change</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Choose Image / PDF</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleSlipUpload}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary & Submit */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-3xl border bg-slate-50/80 space-y-5 sticky top-28">
                  <h3 className="font-black text-lg text-slate-900">Your Order Summary</h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex items-center justify-between gap-3 text-xs border-b pb-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-black px-2 py-0.5 rounded bg-white border">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                            {item.variantLabel && (
                              <p className="text-[10px] text-slate-500">{item.variantLabel}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-bold">Rs. {cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Fee</span>
                      <span className="font-bold">
                        {cartShipping === 0 ? "FREE" : `Rs. ${cartShipping.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Method</span>
                      <span className="font-extrabold text-slate-900">
                        {checkoutForm.paymentMethod === "COD"
                          ? "Cash on Delivery (COD)"
                          : "Bank Deposit"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t">
                    <span className="font-black text-sm text-slate-900">Total Payable</span>
                    <span className="text-2xl font-black" style={{ color: primaryColor }}>
                      Rs. {cartTotal.toLocaleString()}
                    </span>
                  </div>

                  {checkoutError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      {checkoutError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Your Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Place Order (Rs. {cartTotal.toLocaleString()})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : activePage === "order-success" ? (
        /* ── ORDER CONFIRMATION PAGE ── */
        <div className="py-16 max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
              ORDER CONFIRMED
            </span>
            <h1 className="text-3xl font-black text-slate-900">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-slate-600">
              Your order{" "}
              <strong className="text-slate-900 font-black">
                #{placedOrder?.orderNumber || "WEB-ORDER"}
              </strong>{" "}
              has been received by{" "}
              <strong className="text-slate-900">{vendor?.businessName}</strong>.
            </p>
          </div>

          {placedOrder && (
            <div className="p-6 rounded-3xl border bg-slate-50 text-left space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Order Number
                  </span>
                  <span className="font-black text-sm text-slate-900">
                    {placedOrder.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Payment Method
                  </span>
                  <span className="font-black text-xs px-2.5 py-1 rounded-full bg-white border">
                    {placedOrder.paymentMethod === "COD"
                      ? "Cash on Delivery (COD)"
                      : "Bank Deposit"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                  <span>Total Amount</span>
                  <span style={{ color: primaryColor }}>
                    Rs. {Number(placedOrder.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {whatsappPhone && placedOrder && (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Hi ${vendor?.businessName}, I just placed Order #${placedOrder.orderNumber} (Total: Rs. ${Number(
                    placedOrder.totalAmount
                  ).toLocaleString()} via ${placedOrder.paymentMethod}) on your website!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Order Receipt on WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => navigateTo("home")}
              className="px-6 py-3 rounded-full border bg-white text-slate-800 font-bold text-xs"
            >
              Return to Store Home
            </button>
          </div>
        </div>
      ) : activePage === "products" ? (
        /* ── DEDICATED PRODUCTS / ADS CATALOG PAGE ── */
        <div>
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <button onClick={() => navigateTo("home")} className="hover:text-slate-900">
                Home
              </button>
              <span>/</span>
              <span className="text-slate-900 font-bold">{catalogTitle}</span>
            </div>
          </div>

          <section className="py-14 bg-slate-50/70 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {config?.productsSection?.badge ||
                    (entityType === "ADS_SELLER" ? "VERIFIED CLASSIFIEDS" : "OFFICIAL STORE CATALOG")}
                </span>
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {catalogTitle}
              </h1>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                {isMultiPage
                  ? "Click on any item to view full details, select options, and order online via Cash on Delivery or Bank Deposit."
                  : "Browse our catalog and inquire via WhatsApp, Email, or Direct Message."}
              </p>

              {/* Search & Category Filter */}
              <div className="max-w-xl mx-auto pt-3 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search products, keywords..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-white text-xs font-semibold focus:outline-none shadow-xs"
                  />
                </div>
                {productCategories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl border bg-white text-xs font-bold text-slate-700"
                  >
                    <option value="all">All Categories</option>
                    {productCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </section>

          <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((p: any, idx: number) => renderProductCard(p, idx))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">No matching items found</h3>
              </div>
            )}
          </section>
        </div>
      ) : activePage === "services" ? (
        /* ── DEDICATED SERVICES LISTING PAGE ── */
        <div>
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <button onClick={() => navigateTo("home")} className="hover:text-slate-900">
                Home
              </button>
              <span>/</span>
              <span className="text-slate-900 font-bold">{services.title || "Our Services"}</span>
            </div>
          </div>

          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: primaryColor }}
              >
                SERVICES &amp; PACKAGES
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {services.title || "Our Services & Packages"}
              </h1>
              {services.subtitle && <p className="text-slate-500 text-sm">{services.subtitle}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {normalizedServices.map((s: any, idx: number) => renderServiceCard(s, idx))}
            </div>
          </section>
        </div>
      ) : activePage === "reviews" ? (
        /* ── DEDICATED CUSTOMER REVIEWS PAGE ── */
        <div className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: primaryColor }}
            >
              CUSTOMER TESTIMONIALS &amp; REVIEWS
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
              {reviews.title || `What Customers Say About ${vendor?.businessName}`}
            </h1>
            <p className="text-xs text-slate-500">
              Read verified reviews from our customers or share your own experience below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-4">
              {[...(reviews.items || []), ...localReviews].length > 0 ? (
                [...(reviews.items || []), ...localReviews].map((r: any, idx: number) => (
                  <div key={r.id || idx} className="p-6 rounded-2xl border bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-sm text-slate-900">
                          {r.customerName || r.name || "Verified Customer"}
                        </p>
                        {r.itemName && (
                          <p className="text-[11px] font-semibold text-slate-400">
                            Reviewed: {r.itemName}
                          </p>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (r.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                    {r.vendorReply && (
                      <div
                        className="mt-2 p-3 rounded-xl bg-slate-50 border-l-4 text-xs"
                        style={{ borderColor: primaryColor }}
                      >
                        <strong className="block text-slate-900">
                          Reply from {vendor?.businessName}:
                        </strong>
                        <span className="text-slate-600">{r.vendorReply}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 rounded-2xl border text-center text-slate-500 text-sm">
                  No reviews yet. Be the first to leave a review!
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={(e) => handleReviewSubmit(e, null, "STORE")}
                className="p-6 rounded-3xl border bg-slate-50 space-y-4"
              >
                <h3 className="font-black text-lg text-slate-900">Leave a Store Review</h3>
                {reviewSubmittedMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {reviewSubmittedMsg}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewForm.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Comment *</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmittingReview ? "Submitting..." : "Publish Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : requestedCustomPage ? (
        /* ── CUSTOM MULTI-PAGE VIEW ── */
        <div>
          <div className="bg-slate-50 border-b py-3">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <button onClick={() => navigateTo("home")} className="hover:text-slate-900">
                Home
              </button>
              <span>/</span>
              <span className="text-slate-900 font-bold">{requestedCustomPage.title}</span>
            </div>
          </div>

          <section className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{requestedCustomPage.sectionsJson?.banner?.badge || vendor?.businessName}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                {requestedCustomPage.sectionsJson?.banner?.title || requestedCustomPage.title}
              </h1>
              {(requestedCustomPage.sectionsJson?.banner?.subtitle ||
                requestedCustomPage.metaDescription) && (
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                  {requestedCustomPage.sectionsJson?.banner?.subtitle ||
                    requestedCustomPage.metaDescription}
                </p>
              )}
            </div>
          </section>

          <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {requestedCustomPage.sectionsJson?.banner?.bgImage && (
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border bg-slate-50 shadow-md flex items-center justify-center">
                <Image
                  src={requestedCustomPage.sectionsJson.banner.bgImage}
                  alt={requestedCustomPage.title}
                  fill
                  className="object-contain object-center p-2"
                />
              </div>
            )}

            {requestedCustomPage.contentHtml && (
              <div className="bg-white p-6 sm:p-10 rounded-3xl border shadow-sm text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {requestedCustomPage.contentHtml}
              </div>
            )}

            {Array.isArray(requestedCustomPage.sectionsJson?.featureCards) &&
              requestedCustomPage.sectionsJson.featureCards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requestedCustomPage.sectionsJson.featureCards.map((card: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl border bg-white shadow-xs space-y-2"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">{card.title}</h3>
                      {card.description && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {card.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {Array.isArray(requestedCustomPage.sectionsJson?.faq) &&
              requestedCustomPage.sectionsJson.faq.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    {requestedCustomPage.sectionsJson.faq.map((faqItem: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border bg-white shadow-xs space-y-1.5"
                      >
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {faqItem.question}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {faqItem.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {requestedCustomPage.sectionsJson?.cta?.title && (
              <div className="p-6 sm:p-8 rounded-3xl border bg-slate-50 text-center space-y-4">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {requestedCustomPage.sectionsJson.cta.title}
                </h3>
                <button
                  type="button"
                  onClick={() => handleInquiryViaWhatsApp()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {requestedCustomPage.sectionsJson.cta.buttonText || "Chat on WhatsApp"}
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ── HOME PAGE VIEW (1-Page Inquiry Mode OR 6/12-Page Multi-Page Home) ── */
        <>
          {/* Hero Section (Responsive Mobile, Tablet & Desktop Alignment) */}
          {hero.enabled !== false && (
            <section id="home" className="relative py-10 sm:py-16 lg:py-24 overflow-hidden bg-slate-50/60 border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
                <div className="space-y-4 sm:space-y-6 text-left">
                  {hero.badgeText && (
                    <div
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">{hero.badgeText}</span>
                    </div>
                  )}

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 break-words">
                    {hero.title || vendor?.businessName}
                  </h1>

                  <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
                    {hero.subtitle || "Premium quality and personalized customer service."}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-1">
                    {isMultiPage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => navigateTo("products")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          <span>Shop Online Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInquiryViaWhatsApp()}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-100 transition-all"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{hero.buttonText || "Chat on WhatsApp"}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInquiryViaWhatsApp()}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>{hero.buttonText || "Order via WhatsApp"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openInquiryModal({ name: vendor?.businessName || "Store Inquiry" }, "PRODUCT")
                          }
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-100 transition-all"
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>Email / Direct Inquiry</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
                    {hero.bgImage ? (
                      <Image src={hero.bgImage} alt="Hero" fill className="object-cover" priority />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400 p-6 text-center">
                        <ShoppingBag className="w-16 h-16 mb-2 opacity-40" />
                        <span className="text-xs uppercase font-bold tracking-widest">
                          {vendor?.businessName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Services Section */}
          {services.enabled !== false && normalizedServices.length > 0 && (
            <section id="services" className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
                <div>
                  <span
                    className="text-[11px] sm:text-xs font-black uppercase tracking-widest"
                    style={{ color: primaryColor }}
                  >
                    OUR SERVICES &amp; OFFERINGS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                    {services.title || "Featured Services"}
                  </h2>
                  {services.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">{services.subtitle}</p>
                  )}
                </div>
                {isMultiPage && (
                  <button
                    type="button"
                    onClick={() => navigateTo("services")}
                    className="text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 hover:underline self-start sm:self-auto"
                    style={{ color: primaryColor }}
                  >
                    <span>View All Services</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {normalizedServices.slice(0, 8).map((s: any, idx: number) => renderServiceCard(s, idx))}
              </div>
            </section>
          )}

          {/* Products / Ads Showcase Section */}
          {config?.productsSection?.enabled !== false && (
            <section id="products" className="py-12 sm:py-16 lg:py-20 bg-slate-50/50 border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
                  <div>
                    <span
                      className="text-[11px] sm:text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5"
                      style={{ color: primaryColor }}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{config?.productsSection?.badge || "STORE INVENTORY"}</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                      {config?.productsSection?.title || catalogTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {isMultiPage
                        ? "Click any item to view details, add to cart, or buy now with COD / Bank Deposit."
                        : "Order or inquire directly via WhatsApp, Email, or our instant inquiry form."}
                    </p>
                  </div>
                  {isMultiPage && products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigateTo("products")}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>View All ({products.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {products && products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.slice(0, 12).map((p: any, idx: number) => renderProductCard(p, idx))}
                  </div>
                ) : (
                  <div className="bg-white border rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-base text-slate-800">No Items Listed Yet</h4>
                    <p className="text-xs text-slate-500">
                      Products and ads you add in your TryMe dashboard will automatically sync and appear right here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* About Section */}
          {about.enabled !== false && (
            <section id="about" className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="space-y-4 sm:space-y-6">
                  <span
                    className="text-[11px] sm:text-xs font-black uppercase tracking-widest inline-block"
                    style={{ color: primaryColor }}
                  >
                    {about.badge || "ABOUT US"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                    {about.title || `About ${vendor?.businessName}`}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                    {about.content || "Dedicated to providing the best products and experiences."}
                  </p>
                </div>
                <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden relative border shadow-lg">
                  {about.images?.[0] ? (
                    <Image src={about.images[0]} alt="About" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-8 text-center">
                      <Building2 className="w-12 h-12 opacity-30 text-slate-500 mb-2" />
                      <span className="font-bold text-xs uppercase tracking-widest text-slate-600">
                        {vendor?.businessName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Reviews / Testimonials Section on Home */}
          {(reviews.enabled || localReviews.length > 0) && (
            <section id="reviews" className="py-20 bg-slate-50/50 border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
                  <div>
                    <span
                      className="text-xs font-black uppercase tracking-widest"
                      style={{ color: primaryColor }}
                    >
                      CUSTOMER REVIEWS
                    </span>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                      {reviews.title || "What Our Customers Say"}
                    </h2>
                  </div>
                  {isMultiPage && (
                    <button
                      type="button"
                      onClick={() => navigateTo("reviews")}
                      className="px-5 py-2.5 rounded-full border bg-white text-xs font-bold hover:bg-slate-50"
                    >
                      Write / View All Reviews
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {([...(localReviews || []), ...(reviews.items || [])].slice(0, 6).length > 0
                    ? [...(localReviews || []), ...(reviews.items || [])].slice(0, 6)
                    : [
                        {
                          name: "Chathuri Fernando",
                          comment: "Amazing service and top quality items! Highly recommended!",
                          rating: 5,
                        },
                        {
                          name: "Nimali Perera",
                          comment: "Fast delivery and great communication on WhatsApp.",
                          rating: 5,
                        },
                        {
                          name: "Yasara Silva",
                          comment: "100% genuine products. Will definitely order again!",
                          rating: 5,
                        },
                      ]
                  ).map((r: any, idx: number) => (
                    <div key={r.id || idx} className="bg-white p-6 rounded-2xl border shadow-xs space-y-3">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (r.rating || 5) ? "fill-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 italic">&ldquo;{r.comment}&rdquo;</p>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-extrabold text-slate-900">
                          {r.customerName || r.name || "Verified Customer"}
                        </p>
                        {r.itemName && (
                          <p className="text-[10px] text-slate-400 font-semibold">{r.itemName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Contact Us Section ── */}
      <ContactSectionClient
        contact={contact}
        vendor={vendor}
        primaryColor={primaryColor}
        whatsappUrl={whatsappUrl}
      />

      {/* ── Rich Multi-Column Footer ── */}
      <FooterSectionClient
        footer={footer}
        contact={contact}
        vendor={vendor}
        primaryColor={primaryColor}
        pages={pages}
        visibleNavItems={visibleNavItems}
        domainOrSlug={domainOrSlug}
        entityType={entityType}
        onNavigate={(target, type) => {
          if (type === "page") {
            navigateTo(target);
          } else {
            handleNavItemClick({ target, type: type || "scroll" });
          }
        }}
      />

      {/* ── INQUIRY / ORDER MODAL (Used for 1-Page Website & Quick Inquiries) ── */}
      {inquiryModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setInquiryModalItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                ORDER / INQUIRY
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {inquiryModalItem.displayTitle}
              </h3>
              {inquiryModalItem.displayPrice && (
                <p className="text-sm font-black mt-0.5" style={{ color: primaryColor }}>
                  {inquiryModalItem.displayPrice}
                </p>
              )}
            </div>

            {inquirySuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base text-emerald-950">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-emerald-800">
                  {vendor?.businessName} has received your order inquiry and will contact you shortly.
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleInquiryViaWhatsApp()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Also Chat on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryModalItem(null)}
                    className="px-4 py-2 rounded-xl border bg-white text-slate-700 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmitDirect} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.customerName}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, customerName: e.target.value })
                      }
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryForm.customerPhone}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, customerPhone: e.target.value })
                      }
                      placeholder="07XXXXXXXX"
                      className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Your Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={inquiryForm.customerEmail}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, customerEmail: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={inquiryForm.quantity}
                      onChange={(e) =>
                        setInquiryForm({
                          ...inquiryForm,
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Message / Order Note
                  </label>
                  <textarea
                    rows={3}
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, message: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 text-xs font-semibold"
                  />
                </div>

                {/* 3 Ways to Order / Inquire: Direct Submit, WhatsApp, Email */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmittingInquiry ? "Sending Inquiry..." : "Send Direct Inquiry to Store"}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInquiryViaWhatsApp()}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInquiryViaEmail()}
                      className="py-2.5 px-3 rounded-xl border bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Order via Email</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

