"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Globe,
  Lock,
  Unlock,
  CheckCircle2,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Building2,
  Info,
  ShieldCheck,
  Eye,
  AlertCircle,
  Copy,
  Loader2,
  ArrowLeft,
  HelpCircle,
  ShoppingBag, ShoppingCart,  Briefcase,  Menu,
  Sliders,
  Video,
  Layers,
  ChevronUp,
  Camera,
  Star,
  Clock,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Share2,
  RotateCcw,
  Sparkles,
  Palette,
  LayoutTemplate,
  Flame,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/image";
import { TIER_LIMITS, WebsiteTier, CustomWebsiteSection, CustomSectionType, HeroDesignStyle } from "@/types/website-builder";
import CustomSectionEditor from "./CustomSectionEditor";


// 10 Hero Section Design Presets for Storefront
const HERO_DESIGN_PRESETS: {
  id: HeroDesignStyle;
  name: string;
  description: string;
  previewBg: string;
  icon: any;
}[] = [
  {
    id: "split_classic",
    name: "Classic Split Showcase",
    description: "Balanced left typography with rounded 4:3 product image and dual action buttons.",
    previewBg: "from-blue-600/10 via-indigo-600/5 to-slate-50",
    icon: LayoutTemplate,
  },
  {
    id: "corporate_overlay",
    name: "Corporate Enterprise Overlay",
    description: "Cinematic full-width dark backdrop, gold accent highlights & bottom category tabs.",
    previewBg: "from-slate-950 via-slate-900 to-amber-950/40",
    icon: Building2,
  },
  {
    id: "tech_modern",
    name: "Smart Tech & App Showcase",
    description: "Vibrant cyan gradient, modern pill buttons & floating live store care card.",
    previewBg: "from-cyan-500/10 via-teal-500/5 to-slate-50",
    icon: Sparkles,
  },
  {
    id: "organic_minimal",
    name: "Organic Minimalist Luxury",
    description: "Warm sand/cream canvas, refined editorial serif typography & framed product hero.",
    previewBg: "from-amber-100/40 via-stone-100/30 to-amber-50/20",
    icon: Palette,
  },
  {
    id: "fashion_editorial",
    name: "Fashion Editorial Boutique",
    description: "Full-bleed high-contrast boutique banner with centered bold typography & nav arrows.",
    previewBg: "from-rose-950/30 via-slate-900 to-stone-900",
    icon: ShoppingBag,
  },
  {
    id: "centered_impact",
    name: "Centered High-Impact Bold",
    description: "Center-aligned punchy typography with ratings trust bar and prominent dual CTAs.",
    previewBg: "from-violet-500/10 via-indigo-500/5 to-slate-50",
    icon: Star,
  },
  {
    id: "glassmorphism",
    name: "Dark Neon Glassmorphism",
    description: "Dark ambient backdrop with glowing color orbs & translucent frosted glass card.",
    previewBg: "from-slate-950 via-slate-900 to-cyan-950",
    icon: Sparkles,
  },
  {
    id: "promo_sale",
    name: "Mega Sale & Urgency Banner",
    description: "Vibrant promotional gradient with hot deal tags, discounts and countdown feel.",
    previewBg: "from-rose-500/15 via-pink-500/10 to-amber-500/10",
    icon: Flame,
  },
  {
    id: "video_motion",
    name: "Cinematic Video / Ambient Hero",
    description: "Full-height ambient motion hero with play button prompt & dark readability gradient.",
    previewBg: "from-slate-950 via-slate-900 to-slate-950",
    icon: Video,
  },
  {
    id: "store_catalog",
    name: "Store Catalog & Quick Search",
    description: "Prominent store search bar with horizontal category chips and mini product previews.",
    previewBg: "from-emerald-500/10 via-teal-500/5 to-slate-50",
    icon: Search,
  },
];

export default function WebsiteBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Config & State
  const [config, setConfig] = useState<any>({
    primaryColor: "#5c2336",
    secondaryColor: "#111827",
    fontFamily: "Inter",
    headerStyle: "sticky",
    heroSection: {
      enabled: true,
      title: "",
      subtitle: "",
      buttonText: "Book via WhatsApp",
      buttonLink: "#contact",
      bgImage: "",
      badgeText: "PREMIUM SELECTION",
    },
    aboutSection: {
      enabled: true,
      title: "About Us",
      content: "",
      images: [],
    },
    servicesSection: {
      enabled: true,
      title: "Featured Services & Products",
      items: [],
    },
    gallerySection: { enabled: false, title: "A Glimpse of Our Work", images: [] },
    reviewsSection: {
      enabled: false,
      title: "What Our Customers Say",
      items: [],
    },
    contactSection: {
      enabled: true,
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
    },
    footerSection: {
      enabled: true,
      copyrightText: `© ${new Date().getFullYear()} All rights reserved.`,
    },
    isPublished: false,
  });

  const [entityInfo, setEntityInfo] = useState<any>({
    businessName: "",
    slug: "",
    logo: null,
  });

  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [subscriptionLifecycle, setSubscriptionLifecycle] = useState<any>(null);
  const [customDomain, setCustomDomain] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [entityType, setEntityType] = useState<"VENDOR" | "ADS_SELLER">("VENDOR");

  // Dialogs
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTierForUpgrade, setSelectedTierForUpgrade] = useState<WebsiteTier>("SIX_PAGES");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState("");

  // Builder Active Tab & Custom Page Designer State
  const [builderTab, setBuilderTab] = useState<string>("branding");

  // Section Accordion State: all sections collapsed by default, click arrow or header to expand
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSectionOpen = (secKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey],
    }));
  };
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [addSectionForPage, setAddSectionForPage] = useState(false);

  const [isSavingPage, setIsSavingPage] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // New Page Dialog
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageInNavbar, setNewPageInNavbar] = useState(true);
  const [newPageInFooter, setNewPageInFooter] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const autoSaveTimeoutRef = useRef<any>(null);
  const autoSaveConfig = (cfgToSave: any) => {
    if (
      subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ||
      subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED"
    ) {
      return;
    }
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/vendor/website/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cfgToSave),
        });
      } catch (e) {
        console.error("Auto-save error:", e);
      }
    }, 400);
  };

  // Navigation Items Management
  const getEffectiveNavItems = () => {
    const defaults = [
      { id: "home", label: "Home", type: "scroll", target: "home", visible: true },
      {
        id: "products",
        label: entityType === "ADS_SELLER" ? "My Ads" : "Products",
        type: "scroll",
        target: "products",
        visible: config.productsSection?.enabled !== false,
      },
      {
        id: "services",
        label: "Services",
        type: "scroll",
        target: "services",
        visible: config.servicesSection?.enabled !== false,
      },
      { id: "about", label: "About", type: "scroll", target: "about", visible: config.aboutSection?.enabled !== false },
      {
        id: "gallery",
        label: "Gallery",
        type: "scroll",
        target: "gallery",
        visible: Boolean(config.gallerySection?.enabled) && Boolean(config.gallerySection?.images && config.gallerySection.images.length > 0),
      },
      {
        id: "reviews",
        label: "Reviews",
        type: "scroll",
        target: "reviews",
        visible: Boolean(config.reviewsSection?.enabled) && Boolean(config.reviewsSection?.items && config.reviewsSection.items.length > 0),
      },
      { id: "contact", label: "Contact", type: "scroll", target: "contact", visible: true },
    ];

    if (!Array.isArray(config.navItemsJson) || config.navItemsJson.length === 0) {
      return defaults;
    }

    const saved = [...config.navItemsJson];
    defaults.forEach((def) => {
      const exists = saved.some((s: any) => s.id === def.id || (s.target === def.target && s.type === def.type));
      if (!exists) {
        saved.push(def);
      }
    });

    return saved;
  };

  const isCustomPageInNavbar = (page: any) => {
    if (!page) return false;
    const pageItemId = `custom-page-${page.id}`;
    const navItem = getEffectiveNavItems().find(
      (it: any) => it.id === pageItemId || (it.type === "page" && it.target === page.slug)
    );
    if (navItem && navItem.visible !== undefined) {
      return navItem.visible !== false && navItem.visible !== "false";
    }
    return page.sectionsJson?.showInNavbar !== false;
  };

  const isCustomPageInFooter = (page: any) => {
    if (!page) return false;
    if (page.sectionsJson?.showInFooter === false) return false;
    const hiddenList: string[] = Array.isArray(config.footerSection?.hiddenPageSlugs)
      ? config.footerSection.hiddenPageSlugs
      : [];
    if (hiddenList.includes(page.slug) || hiddenList.includes(page.id)) return false;
    return true;
  };

  const handleUpdateNavItem = (id: string, updates: Partial<any>) => {
    const current = getEffectiveNavItems();
    const idx = current.findIndex((it: any) => it.id === id);
    let updatedList: any[];
    if (idx >= 0) {
      updatedList = [...current];
      updatedList[idx] = { ...updatedList[idx], ...updates };
    } else {
      updatedList = [...current, { id, ...updates }];
    }
    setConfig((prev: any) => {
      // NOTE: Updating navbar item visibility ONLY controls whether the item appears
      // in the top navigation bar. It does NOT disable the section on the page!
      const nextConfig = { ...prev, navItemsJson: updatedList };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });
  };

  const handleToggleCustomPageInNav = (page: any, visible: boolean) => {
    const current = getEffectiveNavItems();
    const pageItemId = `custom-page-${page.id}`;
    const idx = current.findIndex((it: any) => it.id === pageItemId || it.target === page.slug);
    let updatedList: any[];
    if (idx >= 0) {
      updatedList = [...current];
      updatedList[idx] = { ...updatedList[idx], visible, target: page.slug, type: "page", isCustom: true };
    } else {
      updatedList = [
        ...current,
        {
          id: pageItemId,
          label: page.title,
          type: "page",
          target: page.slug,
          visible,
          isCustom: true,
        },
      ];
    }

    const updatedSections = { ...(page.sectionsJson || {}), showInNavbar: visible };
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, sectionsJson: updatedSections } : p))
    );
    if (editingPage?.id === page.id) {
      setEditingPage((prev: any) => (prev ? { ...prev, sectionsJson: updatedSections } : prev));
    }

    setConfig((prev: any) => {
      const nextConfig = { ...prev, navItemsJson: updatedList };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });

    // Also persist on the page record itself
    fetch(`/api/vendor/website/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: page.title,
        slug: page.slug,
        sectionsJson: updatedSections,
      }),
    }).catch(() => {});
  };

  const handleToggleCustomPageInFooter = (page: any, visible: boolean) => {
    const currentHidden: string[] = Array.isArray(config.footerSection?.hiddenPageSlugs)
      ? config.footerSection.hiddenPageSlugs
      : [];
    const nextHidden = visible
      ? currentHidden.filter((item) => item !== page.slug && item !== page.id)
      : Array.from(new Set([...currentHidden, page.slug, page.id]));

    const updatedSections = { ...(page.sectionsJson || {}), showInFooter: visible };
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, sectionsJson: updatedSections } : p))
    );
    if (editingPage?.id === page.id) {
      setEditingPage((prev: any) => (prev ? { ...prev, sectionsJson: updatedSections } : prev));
    }

    setConfig((prev: any) => {
      const nextConfig = {
        ...prev,
        footerSection: {
          ...(prev.footerSection || {}),
          showPagesLinks: visible ? true : prev.footerSection?.showPagesLinks !== false,
          hiddenPageSlugs: nextHidden,
        },
      };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });

    // Also persist on the page record itself
    fetch(`/api/vendor/website/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: page.title,
        slug: page.slug,
        sectionsJson: updatedSections,
      }),
    }).catch(() => {});
  };

  const handleUpdateContactSection = (updates: Partial<any>) => {
    setConfig((prev: any) => {
      const nextConfig = {
        ...prev,
        contactSection: { ...(prev.contactSection || {}), ...updates },
      };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });
  };

  const handleUpdateFooterSection = (updates: Partial<any>) => {
    setConfig((prev: any) => {
      const nextConfig = {
        ...prev,
        footerSection: { ...(prev.footerSection || {}), ...updates },
      };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });
  };

  const handleResetNavItems = () => {
    const defaultList = [
      { id: "home", label: "Home", type: "scroll", target: "home", visible: true },
      { id: "services", label: "Services", type: "scroll", target: "services", visible: true },
      {
        id: "products",
        label: entityType === "ADS_SELLER" ? "My Ads" : "Products",
        type: "scroll",
        target: "products",
        visible: true,
      },
      { id: "about", label: "About", type: "scroll", target: "about", visible: true },
      { id: "gallery", label: "Gallery", type: "scroll", target: "gallery", visible: true },
      { id: "reviews", label: "Reviews", type: "scroll", target: "reviews", visible: true },
      { id: "contact", label: "Contact", type: "scroll", target: "contact", visible: true },
    ];
    setConfig((prev: any) => ({ ...prev, navItemsJson: defaultList }));
    toast.success("Navbar reset to default items");
  };

  // Send live update to iframe whenever config changes or preview asks for it
  const sendPreviewUpdate = (overrideDeviceView?: "desktop" | "tablet" | "mobile") => {
    if (loading) return;
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const effectiveDeviceView =
        overrideDeviceView ||
        (mobilePreviewOpen || (typeof window !== "undefined" && window.innerWidth < 768)
          ? "mobile"
          : deviceView);
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PREVIEW_UPDATE",
          activePageSlug: editingPage?.slug || "home",
          deviceView: effectiveDeviceView,
          payload: {
            config,
            entityInfo,
            pages,
            products,
            entityType,
            activeTier: activeSubscription?.tier || "ONE_PAGE",
          },
        },
        "*"
      );
    }
  };

  useEffect(() => {
    if (!loading) {
      sendPreviewUpdate();
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PREVIEW_READY") {
        if (!loading) {
          sendPreviewUpdate();
        }
      } else if (e.data?.type === "PAGE_SELECTED_IN_PREVIEW" && e.data?.pageSlug) {
        if (e.data.pageSlug === "home") {
          setEditingPage(null);
        } else {
          const found = pages.find((p: any) => p.slug === e.data.pageSlug);
          if (found) {
            handleSelectPageForDesign(found);
            setBuilderTab("pages");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [config, entityInfo, pages, editingPage, loading, deviceView]);

  // Initial Data Fetch & Payment Verification
  useEffect(() => {
    fetchWebsiteData();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get("payment");
      const subId = urlParams.get("subId");

      if (paymentStatus === "success" && subId) {
        toast.loading("Verifying your payment and activating plan...", { id: "payment-verify" });
        fetch("/api/vendor/website/subscribe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              toast.success(data.message || "Plan upgraded successfully!", { id: "payment-verify" });
              fetchWebsiteData();
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            } else {
              toast.error(data.error || "Payment verification failed", { id: "payment-verify" });
            }
          })
          .catch((err) => {
            toast.error(err.message || "Payment verification error", { id: "payment-verify" });
          });
      } else if (paymentStatus === "cancelled") {
        toast.info("Payment was cancelled", { id: "payment-verify" });
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const fetchWebsiteData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/website/config");
      const json = await res.json();
      if (json.success) {
        const storeInfo = json.data.entityInfo || {};
        const storeName = storeInfo.businessName || "My Store";

        if (json.data.entityInfo) {
          setEntityInfo(json.data.entityInfo);
        }
        if (json.data.config) {
          const cfg = json.data.config;
          setConfig({
            ...cfg,
            primaryColor: cfg.primaryColor || "#5c2336",
            heroSection: {
              enabled: true,
              title: cfg.heroSection?.title || storeName,
              subtitle: cfg.heroSection?.subtitle || "Discover high quality curated products with premium customer care.",
              buttonText: cfg.heroSection?.buttonText || "Book via WhatsApp",
              buttonLink: cfg.heroSection?.buttonLink || "#contact",
              bgImage: cfg.heroSection?.bgImage || storeInfo.banner || "",
              badgeText: cfg.heroSection?.badgeText || "PREMIUM SELECTION",
              ...(cfg.heroSection || {}),
            },
            aboutSection: {
              enabled: cfg.aboutSection?.enabled !== false,
              title: cfg.aboutSection?.title || `About ${storeName}`,
              content: cfg.aboutSection?.content || "We provide professional services and high quality products in a clean, welcoming environment.",
              images: cfg.aboutSection?.images || [],
              ...(cfg.aboutSection || {}),
            },
            servicesSection: cfg.servicesSection || {
              enabled: true,
              title: "Featured Services & Products",
              items: [],
            },
            gallerySection: cfg.gallerySection || { enabled: false, title: "A Glimpse of Our Work", images: [] },
            reviewsSection: cfg.reviewsSection || { enabled: false, title: "What Our Customers Say", items: [] },
            contactSection: {
              enabled: true,
              phone: storeInfo.businessPhone || storeInfo.phone || "",
              whatsapp: storeInfo.businessPhone || storeInfo.phone || "",
              email: storeInfo.businessEmail || "",
              address: storeInfo.businessAddress || "",
              ...(cfg.contactSection || {}),
            },
            footerSection: cfg.footerSection || {
              enabled: true,
              copyrightText: `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`,
            },
          });
          if (json.data.config.pages) {
            setPages(json.data.config.pages);
          }
        }
        if (json.data.products) {
          setProducts(json.data.products);
        }
        if (json.data.entityType) {
          setEntityType(json.data.entityType);
        }
        setActiveSubscription(json.data.activeSubscription || null);
        if (json.data.subscriptionLifecycle) {
          setSubscriptionLifecycle(json.data.subscriptionLifecycle);
          if (json.data.subscriptionLifecycle.autoDisconnectedDomain) {
            toast.error(
              `Your plan expired over 14 days ago. Live domain (${json.data.subscriptionLifecycle.autoDisconnectedDomain}) was automatically disconnected.`
            );
          }
        }
        if (json.data.customDomain) {
          setCustomDomain(json.data.customDomain);
          setNewDomainInput(json.data.customDomain.domain);
        } else {
          setCustomDomain(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load website builder settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (
      subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ||
      subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED"
    ) {
      toast.error(
        "Your 1-month website plan has expired! You cannot update or publish your website until you renew or upgrade your plan."
      );
      setUpgradeModalOpen(true);
      return;
    }

    if (publish && !activeSubscription) {
      toast.error("Please activate a 1-month website plan to publish your live website.");
      setUpgradeModalOpen(true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...config,
        isPublished: publish ? true : config.isPublished,
      };

      const res = await fetch("/api/vendor/website/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        if (data.subscriptionLifecycle) {
          setSubscriptionLifecycle(data.subscriptionLifecycle);
        }
        toast.success(publish ? "Website published successfully!" : "Draft changes saved!");
      } else {
        toast.error(data.error || "Failed to save changes");
        if (data.code === "SUBSCRIPTION_EXPIRED" || data.code === "SUBSCRIPTION_REQUIRED") {
          setUpgradeModalOpen(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving website");
    } finally {
      setSaving(false);
    }
  };

  // Image upload helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Compressing & uploading image...", { id: "upload-img" });
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("folder", "website-builder");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const url = data.data.url;
        if (targetField === "logo") {
          setEntityInfo((prev: any) => ({ ...prev, logo: url }));
        } else if (targetField === "favicon") {
          setConfig((prev: any) => {
            const updated = {
              ...prev,
              heroSection: { ...(prev.heroSection || {}), faviconUrl: url },
            };
            autoSaveConfig(updated);
            return updated;
          });
        } else if (targetField === "heroImage") {
          setConfig((prev: any) => ({
            ...prev,
            heroSection: { ...prev.heroSection, bgImage: url },
          }));
        } else if (targetField === "aboutImage") {
          setConfig((prev: any) => ({
            ...prev,
            aboutSection: { ...prev.aboutSection, images: [url] },
          }));
        } else if (targetField === "gallery") {
          setConfig((prev: any) => ({
            ...prev,
            gallerySection: {
              ...(prev.gallerySection || {}),
              images: [...(prev.gallerySection?.images || []), url],
            },
          }));
        }
        toast.success("Image uploaded successfully!", { id: "upload-img" });
      } else {
        toast.error(data.error || "Upload failed", { id: "upload-img" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: "upload-img" });
    }
  };

  // Domain Handlers
  const handleConnectDomain = async () => {
    if (!newDomainInput.trim()) {
      toast.error("Please enter a domain name");
      return;
    }
    try {
      const res = await fetch("/api/vendor/website/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomainInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomDomain(data.data);
        toast.success("Domain connected! Please configure DNS records.");
      } else {
        toast.error(data.error || "Failed to connect domain");
        if (data.error?.includes("subscription")) {
          setUpgradeModalOpen(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifyingDomain(true);
    try {
      const res = await fetch("/api/vendor/website/domain/verify", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCustomDomain(data.data);
        if (data.isVerified) {
          toast.success("Domain verified and SSL active!");
        } else {
          toast.warning("DNS not yet propagated. Please check your CNAME / A records.");
        }
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleDisconnectDomain = async () => {
    if (!customDomain) return;
    if (!confirm(`Are you sure you want to disconnect ${customDomain.domain}? Visitors will no longer reach this store via this domain.`)) {
      return;
    }
    setIsVerifyingDomain(true);
    try {
      const res = await fetch("/api/vendor/website/domain", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCustomDomain(null);
        setNewDomainInput("");
        toast.success("Domain disconnected! You can now connect this domain to another website or connect a new one here.");
      } else {
        toast.error(data.error || "Failed to disconnect domain");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect domain");
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  // Bank Transfer Payment Submit
  const handleBankTransferSubmit = async () => {
    if (!slipFile) {
      toast.error("Please upload your bank deposit slip");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append("tier", selectedTierForUpgrade);
      formData.append("slip", slipFile);

      const res = await fetch("/api/vendor/website/subscribe/bank-transfer", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUpgradeModalOpen(false);
        fetchWebsiteData();
      } else {
        toast.error(data.error || "Submission failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bank slip");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Online PayHere Payment Submit
  const handlePayHereSubmit = async () => {
    setIsSubmittingPayment(true);
    try {
      const res = await fetch("/api/vendor/website/subscribe/payhere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTierForUpgrade }),
      });
      const data = await res.json();
      if (data.success) {
        // Create dynamic form and submit to PayHere
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.data.payhereUrl;

        Object.entries(data.data.params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        toast.error(data.error || "Failed to initiate online payment");
        setIsSubmittingPayment(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Online payment error");
      setIsSubmittingPayment(false);
    }
  };

  // Instant Activation (One-click demo/test)
  const handleInstantActivate = async () => {
    setIsSubmittingPayment(true);
    try {
      const res = await fetch("/api/vendor/website/subscribe/payhere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTierForUpgrade }),
      });
      const data = await res.json();
      if (data.success && data.data?.subscriptionId) {
        const verifyRes = await fetch("/api/vendor/website/subscribe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subId: data.data.subscriptionId }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          toast.success(`Plan upgraded successfully to ${TIER_LIMITS[selectedTierForUpgrade].name}!`);
          setUpgradeModalOpen(false);
          fetchWebsiteData();
        } else {
          toast.error(verifyData.error || "Activation failed");
        }
      } else {
        toast.error(data.error || "Failed to create subscription");
      }
    } catch (err: any) {
      toast.error(err.message || "Activation error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Create Custom Page
  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      toast.error("Title and URL slug are required");
      return;
    }

    try {
      const initialSectionsJson = {
        showInNavbar: newPageInNavbar,
        showInFooter: newPageInFooter,
        banner: { title: newPageTitle.trim(), subtitle: "", bgImage: "" },
        featureCards: [],
        faq: [],
        cta: { title: `Have questions about ${newPageTitle.trim()}?`, buttonText: "Chat on WhatsApp" },
      };

      const res = await fetch("/api/vendor/website/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageTitle.trim(),
          slug: newPageSlug.trim(),
          sectionsJson: initialSectionsJson,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const createdPage = {
          ...data.data,
          sectionsJson: data.data.sectionsJson || initialSectionsJson,
        };
        setPages((prev) => [...prev, createdPage]);
        handleToggleCustomPageInNav(createdPage, newPageInNavbar);
        handleToggleCustomPageInFooter(createdPage, newPageInFooter);
        setNewPageModalOpen(false);
        setNewPageTitle("");
        setNewPageSlug("");
        setNewPageInNavbar(true);
        setNewPageInFooter(true);
        toast.success("Page created! You can now design its content.");
        handleSelectPageForDesign(createdPage);
      } else {
        toast.error(data.error || "Failed to create page");
        if (data.requiredTier) {
          setSelectedTierForUpgrade(data.requiredTier);
          setUpgradeModalOpen(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Custom Page Design Handlers ──
  const handleSelectPageForDesign = (page: any) => {
    const fullPage = {
      ...page,
      sectionsJson: {
        showInNavbar: page.sectionsJson?.showInNavbar !== false,
        showInFooter: page.sectionsJson?.showInFooter !== false,
        banner: { title: page.title, subtitle: "", bgImage: "" },
        featureCards: [],
        faq: [],
        cta: { title: `Have questions about ${page.title}?`, buttonText: "Chat on WhatsApp" },
        ...(page.sectionsJson || {}),
      },
    };
    setEditingPage(fullPage);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PREVIEW_SET_PAGE",
          pageSlug: page.slug,
          page: fullPage,
        },
        "*"
      );
    }
  };

  const handleBackToPageList = () => {
    setEditingPage(null);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PREVIEW_SET_PAGE",
          pageSlug: "home",
        },
        "*"
      );
    }
  };

  const handleUpdateEditingPage = (updater: any) => {
    setEditingPage((prev: any) => {
      const updated = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      setPages((currentPages) => currentPages.map((p) => (p.id === updated.id ? updated : p)));

      // If title or slug changed, also keep the custom page entry in navItemsJson synced
      if (updated.title !== prev?.title || updated.slug !== prev?.slug) {
        setConfig((prevCfg: any) => {
          const list = Array.isArray(prevCfg.navItemsJson) ? [...prevCfg.navItemsJson] : [];
          const pageItemId = `custom-page-${updated.id}`;
          const idx = list.findIndex(
            (it: any) => it.id === pageItemId || (it.type === "page" && it.target === prev?.slug)
          );
          if (idx >= 0) {
            list[idx] = {
              ...list[idx],
              label: list[idx].label === prev?.title ? updated.title : list[idx].label || updated.title,
              target: updated.slug,
            };
            const nextCfg = { ...prevCfg, navItemsJson: list };
            autoSaveConfig(nextCfg);
            return nextCfg;
          }
          return prevCfg;
        });
      }

      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PREVIEW_SET_PAGE",
            pageSlug: updated.slug,
            page: updated,
          },
          "*"
        );
      }
      return updated;
    });
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    setIsSavingPage(true);
    try {
      const res = await fetch(`/api/vendor/website/pages/${editingPage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingPage.title,
          slug: editingPage.slug,
          contentHtml: editingPage.contentHtml || "",
          sectionsJson: editingPage.sectionsJson || {},
          metaTitle: editingPage.metaTitle || "",
          metaDescription: editingPage.metaDescription || "",
          isPublished: editingPage.isPublished !== false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Page design saved successfully!");
        setPages((prev) => prev.map((p) => (p.id === data.data.id ? data.data : p)));
        setEditingPage(data.data);
        autoSaveConfig(config);
        sendPreviewUpdate();
      } else {
        toast.error(data.error || "Failed to save page design");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save page");
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this custom page?")) return;
    try {
      const res = await fetch(`/api/vendor/website/pages/${pageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Page deleted successfully!");
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        if (editingPage?.id === pageId) {
          setEditingPage(null);
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: "PREVIEW_SET_PAGE",
                pageSlug: "home",
              },
              "*"
            );
          }
        }
      } else {
        toast.error(data.error || "Failed to delete page");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete page");
    }
  };


  // ── CUSTOM DYNAMIC SECTIONS & REORDERING LOGIC ──
  const getSectionsOrder = (): string[] => {
    const defaultOrder = ["hero", "products", "services", "about", "gallery", "reviews", "contact"];
    let order: string[] = Array.isArray(config?.sectionsOrder) && config.sectionsOrder.length > 0
      ? [...config.sectionsOrder]
      : defaultOrder;

    if (Array.isArray(config?.customSections)) {
      for (const csec of config.customSections) {
        if (csec?.id && !order.includes(csec.id)) {
          order.push(csec.id);
        }
      }
    }

    for (const std of defaultOrder) {
      if (!order.includes(std)) {
        order.push(std);
      }
    }

    return order;
  };

  const getSectionIndex = (secId: string): number => {
    const idx = getSectionsOrder().indexOf(secId);
    return idx !== -1 ? idx : 0;
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const currentOrder = [...getSectionsOrder()];
    const idx = currentOrder.indexOf(sectionId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const temp = currentOrder[idx];
    currentOrder[idx] = currentOrder[targetIdx];
    currentOrder[targetIdx] = temp;

    const updated = {
      ...config,
      sectionsOrder: currentOrder,
    };
    setConfig(updated);
    autoSaveConfig(updated);
    sendPreviewUpdate();
    toast.success(`Section shifted ${direction === "up" ? "up ⬆️" : "down ⬇️"}`);
  };

  const handleAddCustomSection = (type: CustomSectionType, isForPage: boolean = false) => {
    const newId = "csec-" + Date.now();
    let newSection: CustomWebsiteSection;

    if (type === "slider") {
      newSection = {
        id: newId,
        type: "slider",
        title: "Promo Banner Slider",
        enabled: true,
        autoplay: true,
        slides: [
          {
            id: "slide-1",
            imageUrl: "",
            badgeText: "NEW ARRIVAL",
            headline: "Discover Our Exclusive Collection",
            subheadline: "Handpicked selections curated with premium quality.",
            buttonText: "Shop Collection",
            buttonLink: "#products",
          },
          {
            id: "slide-2",
            imageUrl: "",
            badgeText: "LIMITED TIME",
            headline: "Special WhatsApp Deals",
            subheadline: "Contact our team directly to claim exclusive discounts.",
            buttonText: "Chat on WhatsApp",
            buttonLink: "#contact",
          },
        ],
      };
    } else if (type === "video") {
      newSection = {
        id: newId,
        type: "video",
        title: "Product Showcase Video",
        videoTitle: "Watch Our Product Video",
        videoSubtitle: "Discover the quality, craftsmanship, and features behind our products.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        aspectRatio: "16:9",
        videoButtonText: "Inquire Now",
        videoButtonLink: "#contact",
        enabled: true,
      };
    } else if (type === "carousel") {
      newSection = {
        id: newId,
        type: "carousel",
        title: "Featured Highlights",
        subtitle: "Swipe or scroll through our popular items and collections.",
        enabled: true,
        carouselItems: [
          {
            id: "card-1",
            imageUrl: "",
            title: "Featured Item #1",
            price: "Rs. 2,500",
            description: "Top rated by verified customers islandwide.",
            linkUrl: "#products",
          },
          {
            id: "card-2",
            imageUrl: "",
            title: "Featured Item #2",
            price: "Rs. 3,200",
            description: "Limited stock available for delivery.",
            linkUrl: "#products",
          },
          {
            id: "card-3",
            imageUrl: "",
            title: "Featured Item #3",
            price: "Rs. 1,850",
            description: "Premium quality guaranteed with easy returns.",
            linkUrl: "#products",
          },
        ],
      };
    } else if (type === "image_banner") {
      newSection = {
        id: newId,
        type: "image_banner",
        title: "Promotional Banner",
        enabled: true,
        bannerImageUrl: "",
        bannerLinkUrl: "#products",
        bannerHeight: "medium",
        bannerOverlayHeadline: "Seasonal Special Offers!",
        bannerOverlaySubheadline: "Save up to 30% on selected products today.",
        bannerOverlayBtnText: "View Products",
        bannerOverlayBtnLink: "#products",
      };
    } else if (type === "contact_form") {
      newSection = {
        id: newId,
        type: "contact_form",
        title: "Send Us a Message or Order Inquiry",
        subtitle: "Fill out your details below and our team will get in touch with you promptly.",
        enabled: true,
        buttonText: "Submit Direct Inquiry",
      };
    } else if (type === "location_map") {
      newSection = {
        id: newId,
        type: "location_map",
        title: "Store Location & Directions",
        subtitle: "Visit our store or get interactive driving directions.",
        enabled: true,
      };
    } else if (type === "contact_cards") {
      newSection = {
        id: newId,
        type: "contact_cards",
        title: "Direct Contact Information",
        subtitle: "Reach us directly via Phone, WhatsApp, Email, or visit our store.",
        enabled: true,
      };
    } else if (type === "opening_hours") {
      newSection = {
        id: newId,
        type: "opening_hours",
        title: "Opening & Working Hours",
        subtitle: "When you can visit us or receive instant customer support.",
        enabled: true,
      };
    } else if (type === "full_contact") {
      newSection = {
        id: newId,
        type: "full_contact",
        title: "Get in Touch",
        subtitle: "We'd love to hear from you. Contact our team anytime.",
        enabled: true,
      };
    } else if (type === "products_catalog") {
      newSection = {
        id: newId,
        type: "products_catalog",
        title: "Products & Ads Catalog",
        subtitle: "Explore our latest collections and popular items directly from our store.",
        enabled: true,
        itemsLimit: 12,
      };
    } else if (type === "services_list") {
      newSection = {
        id: newId,
        type: "services_list",
        title: "Our Services & Offerings",
        subtitle: "Explore our range of professional services and packages.",
        enabled: true,
      };
    } else if (type === "about_story") {
      newSection = {
        id: newId,
        type: "about_story",
        title: "About Our Story",
        subtitle: "Learn more about our heritage, mission, and commitment to quality.",
        enabled: true,
      };
    } else if (type === "photo_gallery") {
      newSection = {
        id: newId,
        type: "photo_gallery",
        title: "Photo Gallery Showcase",
        subtitle: "Take a visual tour through our store highlights and customer favorites.",
        enabled: true,
      };
    } else if (type === "reviews_list") {
      newSection = {
        id: newId,
        type: "reviews_list",
        title: "Customer Testimonials & Reviews",
        subtitle: "Verified ratings and reviews from our customers islandwide.",
        enabled: true,
      };
    } else {
      newSection = {
        id: newId,
        type: type,
        title: "Custom Section",
        enabled: true,
      };
    }

    if (isForPage && editingPage) {
      const existingPageSecs = editingPage.sectionsJson?.customSections || [];
      const updatedPage = {
        ...editingPage,
        sectionsJson: {
          ...editingPage.sectionsJson,
          customSections: [...existingPageSecs, newSection],
        },
      };
      setEditingPage(updatedPage);
      const updatedPages = pages.map((p) => (p.id === updatedPage.id ? updatedPage : p));
      setPages(updatedPages);

      // Instantly update live preview iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PREVIEW_SET_PAGE",
            pageSlug: updatedPage.slug,
            page: updatedPage,
          },
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PREVIEW_UPDATE",
            activePageSlug: updatedPage.slug,
            deviceView,
            payload: {
              config,
              entityInfo,
              pages: updatedPages,
              products,
              entityType,
              activeTier: activeSubscription?.tier || "ONE_PAGE",
            },
          },
          "*"
        );
      }

      toast.success(`"${newSection.title}" has been added to the bottom of the page!`, {
        description: "Scroll down to configure this section or click 'Save Page' to persist your changes.",
        duration: 5000,
      });
    } else {
      const existingCustom = config.customSections || [];
      const existingOrder = getSectionsOrder();
      const updated = {
        ...config,
        customSections: [...existingCustom, newSection],
        sectionsOrder: [...existingOrder, newId],
      };
      setConfig(updated);
      autoSaveConfig(updated);
      sendPreviewUpdate();

      toast.success(`"${newSection.title}" has been added to the bottom of the page!`, {
        description: "Scroll down to the bottom of the section list to configure or move it up.",
        duration: 5000,
      });
    }

    setAddSectionModalOpen(false);

    // Smooth scroll down to the newly added section and highlight it with a focus ring
    setTimeout(() => {
      const targetElement = document.getElementById(`custom-section-item-${newId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        targetElement.classList.add("ring-2", "ring-indigo-500", "ring-offset-2", "rounded-2xl", "transition-all");
        setTimeout(() => {
          targetElement.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2");
        }, 2500);
      }
    }, 300);
  };

  const handleUpdateCustomSection = (secId: string, updatedSection: CustomWebsiteSection, isForPage: boolean = false) => {
    if (isForPage && editingPage) {
      const pageSecs = (editingPage.sectionsJson?.customSections || []).map((s: any) =>
        s.id === secId ? updatedSection : s
      );
      const updatedPage = {
        ...editingPage,
        sectionsJson: {
          ...editingPage.sectionsJson,
          customSections: pageSecs,
        },
      };
      setEditingPage(updatedPage);
      setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PREVIEW_SET_PAGE",
            pageSlug: updatedPage.slug,
            page: updatedPage,
          },
          "*"
        );
      }
    } else {
      const customSecs = (config.customSections || []).map((s: any) =>
        s.id === secId ? updatedSection : s
      );
      const updated = {
        ...config,
        customSections: customSecs,
      };
      setConfig(updated);
      autoSaveConfig(updated);
      sendPreviewUpdate();
    }
  };

  const handleRemoveCustomSection = (secId: string, isForPage: boolean = false) => {
    if (!confirm("Are you sure you want to remove this section?")) return;
    if (isForPage && editingPage) {
      const pageSecs = (editingPage.sectionsJson?.customSections || []).filter((s: any) => s.id !== secId);
      const updatedPage = {
        ...editingPage,
        sectionsJson: {
          ...editingPage.sectionsJson,
          customSections: pageSecs,
        },
      };
      setEditingPage(updatedPage);
      setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PREVIEW_SET_PAGE",
            pageSlug: updatedPage.slug,
            page: updatedPage,
          },
          "*"
        );
      }
      toast.success("Section removed from page");
    } else {
      const customSecs = (config.customSections || []).filter((s: any) => s.id !== secId);
      const order = getSectionsOrder().filter((id) => id !== secId);
      const updated = {
        ...config,
        customSections: customSecs,
        sectionsOrder: order,
      };
      setConfig(updated);
      autoSaveConfig(updated);
      sendPreviewUpdate();
      toast.success("Section removed from Home Page");
    }
  };

  const handleMovePageCustomSection = (idx: number, direction: "up" | "down") => {
    if (!editingPage) return;
    const pageSecs = [...(editingPage.sectionsJson?.customSections || [])];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= pageSecs.length) return;

    const temp = pageSecs[idx];
    pageSecs[idx] = pageSecs[targetIdx];
    pageSecs[targetIdx] = temp;

    const updatedPage = {
      ...editingPage,
      sectionsJson: {
        ...editingPage.sectionsJson,
        customSections: pageSecs,
      },
    };
    setEditingPage(updatedPage);
    setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PREVIEW_SET_PAGE",
          pageSlug: updatedPage.slug,
          page: updatedPage,
        },
        "*"
      );
    }
  };

  const handlePageBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPage) return;
    toast.loading("Uploading banner image...", { id: "upload-page-banner" });
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("folder", "website-builder/banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const url = data.data.url;
        handleUpdateEditingPage((prev: any) => ({
          ...prev,
          sectionsJson: {
            ...prev.sectionsJson,
            banner: {
              ...(prev.sectionsJson?.banner || {}),
              bgImage: url,
            },
          },
        }));
        toast.success("Banner image uploaded successfully!", { id: "upload-page-banner" });
      } else {
        toast.error(data.error || "Upload failed", { id: "upload-page-banner" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload banner", { id: "upload-page-banner" });
    }
  };

  const handleAddFeatureCard = () => {
    handleUpdateEditingPage((prev: any) => ({
      ...prev,
      sectionsJson: {
        ...prev.sectionsJson,
        featureCards: [
          ...(prev.sectionsJson?.featureCards || []),
          { title: "New Feature", description: "Details about this feature..." },
        ],
      },
    }));
  };

  const handleRemoveFeatureCard = (index: number) => {
    handleUpdateEditingPage((prev: any) => ({
      ...prev,
      sectionsJson: {
        ...prev.sectionsJson,
        featureCards: (prev.sectionsJson?.featureCards || []).filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const handleUpdateFeatureCard = (index: number, field: string, val: string) => {
    handleUpdateEditingPage((prev: any) => {
      const cards = [...(prev.sectionsJson?.featureCards || [])];
      cards[index] = { ...cards[index], [field]: val };
      return {
        ...prev,
        sectionsJson: { ...prev.sectionsJson, featureCards: cards },
      };
    });
  };

  const handleAddFaq = () => {
    handleUpdateEditingPage((prev: any) => ({
      ...prev,
      sectionsJson: {
        ...prev.sectionsJson,
        faq: [
          ...(prev.sectionsJson?.faq || []),
          { question: "Frequently Asked Question?", answer: "Answer to this question..." },
        ],
      },
    }));
  };

  const handleRemoveFaq = (index: number) => {
    handleUpdateEditingPage((prev: any) => ({
      ...prev,
      sectionsJson: {
        ...prev.sectionsJson,
        faq: (prev.sectionsJson?.faq || []).filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const handleUpdateFaq = (index: number, field: string, val: string) => {
    handleUpdateEditingPage((prev: any) => {
      const faqs = [...(prev.sectionsJson?.faq || [])];
      faqs[index] = { ...faqs[index], [field]: val };
      return {
        ...prev,
        sectionsJson: { ...prev.sectionsJson, faq: faqs },
      };
    });
  };

  const currentTier: WebsiteTier =
    activeSubscription?.tier ||
    subscriptionLifecycle?.subscription?.tier ||
    "ONE_PAGE";
  const tierMeta = TIER_LIMITS[currentTier];
  const isSubscriptionExpired =
    subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ||
    subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED";
  const formattedExpiryDate = subscriptionLifecycle?.expiresAt
    ? new Date(subscriptionLifecycle.expiresAt).toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const formattedGraceEndDate = subscriptionLifecycle?.graceEndsAt
    ? new Date(subscriptionLifecycle.graceEndsAt).toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Globe className="w-6 h-6 text-primary absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">
            Loading Website Builder...
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm">
            Syncing your store design, custom pages, and live configurations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 md:-m-6 h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ── Builder Top Toolbar ── */}
      <header className="shrink-0 h-auto md:h-16 py-3 md:py-0 px-3.5 md:px-6 border-b bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-0 relative z-40">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <h1 className="font-black text-base md:text-lg tracking-tight">WEBSITE BUILDER</h1>
          </div>

          {/* Active Plan & Expiry Date Badge */}
          <div className="flex items-center justify-start gap-1.5 md:gap-2 md:pl-4 md:border-l flex-wrap">
            {activeSubscription ? (
              <>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2.5 md:px-3 py-1 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{tierMeta.name} (Active)</span>
                </Badge>
                {formattedExpiryDate && (
                  <Badge
                    variant="outline"
                    className={`font-bold px-2.5 py-1 flex items-center gap-1.5 text-xs ${
                      (subscriptionLifecycle?.daysRemaining ?? 30) <= 5
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      Expires: {formattedExpiryDate}
                      {typeof subscriptionLifecycle?.daysRemaining === "number"
                        ? ` (${subscriptionLifecycle.daysRemaining}d left)`
                        : ""}
                    </span>
                  </Badge>
                )}
              </>
            ) : isSubscriptionExpired ? (
              <>
                <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold px-2.5 md:px-3 py-1 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tierMeta.name} (Expired on {formattedExpiryDate})</span>
                </Badge>
                {subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ? (
                  <Badge className="bg-amber-500 text-white font-bold px-2.5 py-1 text-xs">
                    Grace Period: {subscriptionLifecycle.graceDaysRemaining}d left before domain disconnect
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold px-2.5 py-1 text-xs">
                    Live Domain Disconnected (14d Passed)
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 font-bold px-2.5 md:px-3 py-1 flex items-center gap-1.5 text-xs">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Free Trial Mode</span>
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (activeSubscription?.tier === "ONE_PAGE") {
                  setSelectedTierForUpgrade("SIX_PAGES");
                } else if (activeSubscription?.tier === "SIX_PAGES") {
                  setSelectedTierForUpgrade("TWELVE_PAGES");
                } else if (subscriptionLifecycle?.subscription?.tier) {
                  setSelectedTierForUpgrade(subscriptionLifecycle.subscription.tier);
                }
                setUpgradeModalOpen(true);
              }}
              className="h-8 text-xs font-black uppercase tracking-wider rounded-lg border-primary text-primary hover:bg-primary hover:text-white"
            >
              {isSubscriptionExpired ? "Renew / Upgrade Plan" : "Upgrade Plan"}
            </Button>
          </div>
        </div>

        {/* Device Switcher & Action Buttons (Left-aligned on Mobile: Save Draft, Publish, Preview) */}
        <div className="w-full md:w-auto flex items-center justify-start md:justify-end gap-2 md:gap-3 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          {pages.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600">
              <span className="text-[10px] uppercase font-black px-2 text-slate-400">View:</span>
              <button
                type="button"
                onClick={handleBackToPageList}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !editingPage
                    ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm"
                    : "hover:text-black text-slate-500"
                }`}
              >
                Home
              </button>
              {pages.map((p) => {
                const isSelected = editingPage?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleSelectPageForDesign(p);
                      setBuilderTab("pages");
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all truncate max-w-[120px] ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm font-extrabold"
                        : "hover:text-black text-slate-500"
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-lg transition-colors ${deviceView === "desktop" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500"}`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView("tablet")}
              className={`p-1.5 rounded-lg transition-colors ${deviceView === "tablet" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500"}`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-lg transition-colors ${deviceView === "mobile" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500"}`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving || isSubscriptionExpired}
            className="font-bold text-xs rounded-xl"
            title={
              isSubscriptionExpired
                ? "Plan expired — renew or upgrade to update website"
                : "Save Draft"
            }
          >
            {isSubscriptionExpired ? (
              <Lock className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save Draft
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
            style={{ backgroundColor: isSubscriptionExpired ? "#e11d48" : config.primaryColor }}
          >
            {isSubscriptionExpired ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Locked (Renew to Publish)
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Publish
              </>
            )}
          </Button>

          {/* Mobile-only Preview Toggle Button */}
          <Button
            type="button"
            variant={mobilePreviewOpen ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const next = !mobilePreviewOpen;
              setMobilePreviewOpen(next);
              if (next) {
                setDeviceView("mobile");
                setTimeout(() => sendPreviewUpdate("mobile"), 100);
              }
            }}
            className={`md:hidden font-bold text-xs rounded-xl gap-1.5 ${
              mobilePreviewOpen
                ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                : "border-slate-300 text-slate-700 dark:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{mobilePreviewOpen ? "Close Preview" : "Preview"}</span>
          </Button>
        </div>
      </header>

      {/* ── Subscription Expired / 14-Day Grace Period Alert Banner ── */}
      {isSubscriptionExpired && (
        <div
          className={`px-6 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED"
              ? "bg-rose-600 text-white border-rose-700"
              : "bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-500/30"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3 text-xs">
            <AlertCircle
              className={`w-5 h-5 shrink-0 ${
                subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED"
                  ? "text-white"
                  : "text-rose-600"
              }`}
            />
            <div>
              {subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ? (
                <p className="font-semibold">
                  <strong>Your 1-Month Plan ({tierMeta.name}) expired on {formattedExpiryDate}.</strong>{" "}
                  Website updates &amp; publishing are locked. You have{" "}
                  <strong className="underline">
                    {subscriptionLifecycle.graceDaysRemaining} day(s) remaining
                  </strong>{" "}
                  (until {formattedGraceEndDate}) to renew or upgrade — otherwise your live custom domain will be automatically disconnected and live site access will be disabled!
                </p>
              ) : (
                <p className="font-semibold">
                  <strong>
                    Subscription Expired Over 14 Days Ago ({formattedExpiryDate}) — Live Domain Disconnected &amp; Site Offline!
                  </strong>{" "}
                  Because the plan was not renewed or upgraded within 14 days of expiry, your live domain was automatically disconnected and public access to your website has been suspended. Renew or upgrade your plan now to restore your website.
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setUpgradeModalOpen(true)}
            className={
              subscriptionLifecycle?.state === "EXPIRED_DISCONNECTED"
                ? "bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shrink-0 rounded-xl"
                : "bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 rounded-xl"
            }
          >
            Renew / Upgrade Plan Now
          </Button>
        </div>
      )}

      {/* ── Main Split View ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ── Left Editor Sidebar ── */}
        <div
          className={`${
            mobilePreviewOpen ? "hidden md:block" : "block"
          } w-full lg:w-[480px] h-full border-r bg-white dark:bg-slate-900 overflow-y-auto p-3.5 md:p-6 space-y-5 md:space-y-6 shrink-0`}
        >
          <Tabs value={builderTab} onValueChange={setBuilderTab} className="w-full">
            <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full h-auto bg-slate-100 dark:bg-slate-800 p-1 gap-1 md:gap-0 rounded-xl">
              <TabsTrigger value="branding" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Branding</TabsTrigger>
              <TabsTrigger value="contact" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate text-[#FF6600]">Inquiries</TabsTrigger>
              <TabsTrigger value="sections" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Sections</TabsTrigger>
              <TabsTrigger value="menu" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Navbar</TabsTrigger>
              <TabsTrigger value="pages" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Pages</TabsTrigger>
              <TabsTrigger value="checkout" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Shop/Pay</TabsTrigger>
              <TabsTrigger value="domain" className="text-[11px] font-bold rounded-lg px-2 py-1.5 md:py-1 md:px-1.5 truncate">Domain</TabsTrigger>
            </TabsList>

            {/* TAB 1: BRANDING & THEME */}
            <TabsContent value="branding" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Name</Label>
                  <Input
                    value={entityInfo?.businessName || ""}
                    onChange={(e) => setEntityInfo({ ...entityInfo, businessName: e.target.value })}
                    className="mt-1 font-semibold rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Tagline / Slogan</Label>
                  <Input
                    value={entityInfo?.tagline || ""}
                    onChange={(e) => setEntityInfo({ ...entityInfo, tagline: e.target.value })}
                    placeholder="e.g. Official Flagship Store"
                    className="mt-1 font-semibold rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {entityInfo?.logo ? (
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border shadow-sm">
                        <Image src={entityInfo.logo} alt="Logo" fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {entityInfo?.businessName?.charAt(0) || "S"}
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm">
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logo")} />
                    </label>
                  </div>
                </div>

                {/* Website Favicon (Browser Tab Icon) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Website Favicon (Browser Tab Icon)
                      </Label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Browser tab icon displayed to visitors (Default: Store Logo)
                      </p>
                    </div>
                    {config.heroSection?.faviconUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = {
                            ...config,
                            heroSection: {
                              ...(config.heroSection || {}),
                              faviconUrl: null,
                            },
                          };
                          setConfig(updated);
                          autoSaveConfig(updated);
                          toast.success("Favicon reset to Store Logo");
                        }}
                        className="text-xs h-7 text-slate-500 hover:text-red-500 gap-1 px-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      {config.heroSection?.faviconUrl ? (
                        <Image
                          src={config.heroSection.faviconUrl}
                          alt="Custom Favicon"
                          fill
                          className="object-contain p-1"
                        />
                      ) : entityInfo?.logo ? (
                        <Image
                          src={entityInfo.logo}
                          alt="Store Logo as Favicon"
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-black text-xs text-white"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          {entityInfo?.businessName?.charAt(0) || "S"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm w-fit">
                        <CloudUpload className="w-3.5 h-3.5 text-primary" />
                        <span>{config.heroSection?.faviconUrl ? "Change Favicon" : "Upload Custom Favicon"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "favicon")}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {config.heroSection?.faviconUrl ? "Custom Favicon active" : "Using Store Logo as default"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HEADER & BRAND IDENTITY CUSTOMIZER */}
                <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-blue-600" />
                      <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Header Brand Tagline &amp; Top Action Button
                      </Label>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {currentTier === "ONE_PAGE" ? "1-Page Storefront" : `${tierMeta.name} Store`}
                    </span>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      Store Header Tagline / Subtitle
                    </Label>
                    <Input
                      value={config.headerSection?.subtitle || ""}
                      onChange={(e) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          headerSection: { ...(prev.headerSection || {}), subtitle: e.target.value },
                        }))
                      }
                      placeholder={currentTier === "ONE_PAGE" ? "e.g. Direct Inquiry Storefront (or custom tagline)" : "e.g. Official Online Store (or custom tagline)"}
                      className="mt-1 font-medium rounded-xl text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Text displayed directly beneath your store name in the top navigation header. Leave empty to use tier default.
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Show Top Header Action Button
                        </Label>
                        <span className="text-[10px] text-slate-400 block">
                          Display quick action button on top right header
                        </span>
                      </div>
                      <Switch
                        checked={config.headerSection?.showButton !== false}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            headerSection: { ...(prev.headerSection || {}), showButton: c },
                          }))
                        }
                      />
                    </div>

                    {config.headerSection?.showButton !== false && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <Label className="text-[11px] font-semibold text-slate-500">Button Label / Text</Label>
                          <Input
                            value={config.headerSection?.buttonText || (currentTier === "ONE_PAGE" ? "WhatsApp / Inquire" : "Order via WhatsApp")}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                headerSection: { ...(prev.headerSection || {}), buttonText: e.target.value },
                              }))
                            }
                            placeholder="e.g. WhatsApp / Inquire"
                            className="mt-1 font-semibold rounded-xl text-xs h-9"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold text-slate-500">Button Icon</Label>
                          <select
                            value={config.headerSection?.buttonIcon || "whatsapp"}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                headerSection: { ...(prev.headerSection || {}), buttonIcon: e.target.value },
                              }))
                            }
                            className="w-full h-9 px-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value="whatsapp">💬 WhatsApp / Message</option>
                            <option value="phone">📞 Phone / Call</option>
                            <option value="bag">🛍️ Shopping Bag</option>
                            <option value="none">None (Text Only)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Brand Color</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="font-mono text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography / Font</Label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                    className="w-full h-10 px-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold"
                  >
                    <option value="Inter">Inter (Clean & Modern)</option>
                    <option value="Outfit">Outfit (Fashion & Chic)</option>
                    <option value="Playfair Display">Playfair Display (Luxury & Spa)</option>
                    <option value="Roboto">Roboto (Bold Standard)</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* TAB: WHATSAPP, PHONE & INQUIRIES */}
            <TabsContent value="contact" className="space-y-6 pt-4">
              <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/90 dark:border-orange-800/60 space-y-2">
                <div className="flex items-center gap-2 text-[#FF6600]">
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Store WhatsApp, Inquiries & Contacts
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Configure the dedicated contact channels where your website visitors will submit 1-click WhatsApp orders, direct phone calls, and email inquiries. You can use any custom business numbers here without affecting your TryMe login credentials.
                </p>
              </div>

              {/* 1. WHATSAPP CONFIGURATION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm">WhatsApp Inquiries & Orders</h3>
                  </div>
                  {config.contactSection?.whatsapp ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Not Configured
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    WhatsApp Number
                  </Label>
                  <Input
                    value={config.contactSection?.whatsapp || ""}
                    onChange={(e) => handleUpdateContactSection({ whatsapp: e.target.value })}
                    placeholder="e.g. 0771234567 or 94771234567"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400">
                    When visitors click &quot;Order via WhatsApp&quot;, &quot;Inquire via WhatsApp&quot;, or the floating chat button, it opens a direct chat with this number.
                  </p>
                  {config.contactSection?.whatsapp && (
                    <div className="pt-1">
                      <a
                        href={`https://wa.me/${(() => {
                          let p = (config.contactSection.whatsapp || "").replace(/[^0-9]/g, "");
                          if (p.startsWith("0") && p.length === 10) p = "94" + p.slice(1);
                          return p;
                        })()}?text=Hello%20Store%2C%20testing%20WhatsApp%20order%20link`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Test WhatsApp Link (Opens Chat)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. DIRECT CALL NUMBER */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm">Direct Phone Call Hotline</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Hotline / Mobile Number
                  </Label>
                  <Input
                    value={config.contactSection?.phone || ""}
                    onChange={(e) => handleUpdateContactSection({ phone: e.target.value })}
                    placeholder="e.g. 0112345678 or 0771234567"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400">
                    Displayed on your website header, contact card, and footer for direct telephone calls (tel link).
                  </p>
                </div>
              </div>

              {/* 3. EMAIL ADDRESS */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-sm">Store Inquiries Email</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Customer Inquiries Email
                  </Label>
                  <Input
                    value={config.contactSection?.email || ""}
                    onChange={(e) => handleUpdateContactSection({ email: e.target.value })}
                    placeholder="e.g. sales@yourstore.lk or business@gmail.com"
                    className="rounded-xl text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400">
                    Used for &quot;Order via Email&quot; and inquiry form notifications from your personal website.
                  </p>
                </div>
              </div>

              {/* 4. ADDRESS & SHOP LOCATION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-sm">Physical Shop / Office Address</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Shop / Pickup Address (Optional)
                  </Label>
                  <Input
                    value={config.contactSection?.address || ""}
                    onChange={(e) => handleUpdateContactSection({ address: e.target.value })}
                    placeholder="e.g. No. 45, Galle Road, Colombo 03"
                    className="rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* 5. OPENING HOURS & FORM SETTINGS */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm">Opening / Business Hours</h3>
                  </div>
                  <Switch
                    checked={config.contactSection?.showOpeningHours !== false}
                    onCheckedChange={(c) => handleUpdateContactSection({ showOpeningHours: c })}
                  />
                </div>
                {config.contactSection?.showOpeningHours !== false && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Hours Schedule
                    </Label>
                    <Textarea
                      rows={2}
                      value={
                        config.contactSection?.openingHours ??
                        "Monday – Saturday: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 5:00 PM"
                      }
                      onChange={(e) => handleUpdateContactSection({ openingHours: e.target.value })}
                      placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM"
                      className="rounded-xl text-xs resize-none"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: SECTIONS BUILDER */}
            <TabsContent value="sections" className="flex flex-col space-y-6 pt-4">
              {/* TOP ACTION BAR */}
              <div
                style={{ order: -1 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-xs"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    <span>Page Sections &amp; Layout Order</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Use ⬆️ Up and ⬇️ Down buttons on any section to shift its position. Click &quot;+ Add Custom Section&quot; to add dynamic Sliders, Videos, Carousels, or Banners.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setAddSectionForPage(false);
                    setAddSectionModalOpen(true);
                  }}
                  className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm shrink-0 flex items-center gap-1.5"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Section</span>
                </Button>
              </div>

              {/* DYNAMIC CUSTOM SECTIONS (Sliders, Videos, Carousels, Banners) */}
              {(config.customSections || []).map((csec: any) => {
                const secIdx = getSectionIndex(csec.id);
                const totalSecs = getSectionsOrder().length;
                return (
                  <div key={csec.id} id={`custom-section-item-${csec.id}`} style={{ order: secIdx }}>
                    <CustomSectionEditor
                      section={csec}
                      index={secIdx}
                      total={totalSecs}
                      onUpdate={(u) => handleUpdateCustomSection(csec.id, u)}
                      onDelete={() => handleRemoveCustomSection(csec.id)}
                      onMoveUp={() => handleMoveSection(csec.id, "up")}
                      onMoveDown={() => handleMoveSection(csec.id, "down")}
                      canMoveUp={secIdx > 0}
                      canMoveDown={secIdx < totalSecs - 1}
                    />
                  </div>
                );
              })}
              {/* HERO SECTION (10 MODERN DESIGN PRESETS & INTUITIVE CONTROLS) */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-5 shadow-xs ${
                  config.heroSection?.enabled !== false
                    ? "border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/25 dark:to-slate-900 border-l-4 border-l-blue-600"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                {/* Header & Toggle */}
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("hero")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.heroSection?.enabled !== false
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Hero Section (Home Banner)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Main welcome headline, design layout, CTA buttons &amp; hero media</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.heroSection?.enabled !== false}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          heroSection: { ...prev.heroSection, enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("hero")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["hero"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["hero"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["hero"] && config.heroSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["hero"] && config.heroSection?.enabled !== false && (
                  <div className="space-y-6 pt-2">
                    {/* VISUAL HERO STYLE SELECTOR (10 DISTINCT PRESETS) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-blue-600" />
                          <span>Select Hero Design Style</span>
                        </Label>
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          Active: {HERO_DESIGN_PRESETS.find((p) => p.id === (config.heroSection?.style || "split_classic"))?.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto p-1.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
                        {HERO_DESIGN_PRESETS.map((preset) => {
                          const Icon = preset.icon;
                          const isSelected = (config.heroSection?.style || "split_classic") === preset.id;
                          return (
                            <div
                              key={preset.id}
                              onClick={() =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, style: preset.id },
                                }))
                              }
                              className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col justify-between space-y-2 text-left ${
                                isSelected
                                  ? "border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-500/20"
                                  : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                                    {preset.name}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 bg-blue-600 text-white shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Active
                                  </span>
                                ) : preset.id === "split_classic" ? (
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                    Default
                                  </span>
                                ) : null}
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                {preset.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CONTENT & TYPOGRAPHY INPUTS */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hero Content &amp; Headlines</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Main Headline</Label>
                          <Input
                            value={config.heroSection?.title || ""}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, title: e.target.value },
                              }))
                            }
                            placeholder="e.g. Empowering Our Inspired People"
                            className="rounded-xl mt-1 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                            Accent Highlight Word
                          </Label>
                          <Input
                            value={config.heroSection?.highlightText || ""}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, highlightText: e.target.value },
                              }))
                            }
                            placeholder="e.g. Inspired or Care or Always"
                            className="rounded-xl mt-1 text-xs font-semibold"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">This word will be highlighted in your store's primary accent color.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Badge / Kicker Pill Text</Label>
                          <Input
                            value={config.heroSection?.badgeText || ""}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, badgeText: e.target.value },
                              }))
                            }
                            placeholder="e.g. PREMIUM SELECTION or PURITY YOU CAN VERIFY"
                            className="rounded-xl mt-1 text-xs uppercase font-semibold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Badge Icon</Label>
                          <select
                            value={config.heroSection?.badgeIcon || "sparkles"}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, badgeIcon: e.target.value },
                              }))
                            }
                            className="w-full h-9 px-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value="sparkles">✨ Sparkles</option>
                            <option value="star">⭐️ Star</option>
                            <option value="flame">🔥 Flame / Hot</option>
                            <option value="shield">🛡️ Shield</option>
                            <option value="tag">🏷️ Tag</option>
                            <option value="none">None (Text Only)</option>
                          </select>
                        </div>

                        {(config.heroSection?.style === "promo_sale") && (
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Discount / Deal Tag</Label>
                            <Input
                              value={config.heroSection?.discountTag || ""}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, discountTag: e.target.value },
                                }))
                              }
                              placeholder="e.g. 🔥 MEGA SALE • UP TO 50% OFF"
                              className="rounded-xl mt-1 text-xs font-bold text-rose-600"
                            />
                          </div>
                        )}

                        {(config.heroSection?.style === "corporate_overlay") && (
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Bottom Category Ticker Items (Comma-separated)</Label>
                            <Input
                              value={(config.heroSection?.tickerItems || []).join(", ")}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: {
                                    ...prev.heroSection,
                                    tickerItems: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                  },
                                }))
                              }
                              placeholder="e.g. Our Story, Verified Quality, Fast Delivery"
                              className="rounded-xl mt-1 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Subtitle Description</Label>
                        <Textarea
                          rows={2}
                          value={config.heroSection?.subtitle || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              heroSection: { ...prev.heroSection, subtitle: e.target.value },
                            }))
                          }
                          placeholder="e.g. Dedicated to providing exceptional quality and customer care across Sri Lanka."
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>
                    </div>

                    {/* CALL TO ACTION BUTTONS */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Action Buttons &amp; Icons</span>
                      </h4>

                      {/* Primary Button */}
                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Primary Action Button</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-[11px] font-semibold text-slate-500">Button Text</Label>
                            <Input
                              value={config.heroSection?.buttonText || ""}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, buttonText: e.target.value },
                                }))
                              }
                              placeholder="e.g. Shop Online or Book via WhatsApp"
                              className="rounded-xl mt-1 text-xs font-bold h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-slate-500">Button Link</Label>
                            <Input
                              value={config.heroSection?.buttonLink || ""}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, buttonLink: e.target.value },
                                }))
                              }
                              placeholder="e.g. #products or #contact"
                              className="rounded-xl mt-1 text-xs font-mono h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-slate-500">Button Icon</Label>
                            <select
                              value={config.heroSection?.buttonIcon || "bag"}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, buttonIcon: e.target.value },
                                }))
                              }
                              className="w-full h-9 px-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                            >
                              <option value="bag">🛍️ Shopping Bag</option>
                              <option value="whatsapp">💬 WhatsApp</option>
                              <option value="phone">📞 Phone / Call</option>
                              <option value="zap">⚡ Fast Zap</option>
                              <option value="arrow">➡️ Arrow Right</option>
                              <option value="none">None (Text Only)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Button */}
                      <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Secondary Action Button</span>
                            <span className="text-[10px] text-slate-400">Show or hide the secondary outline button</span>
                          </div>
                          <Switch
                            checked={config.heroSection?.showSecondaryButton !== false}
                            onCheckedChange={(c) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, showSecondaryButton: c },
                              }))
                            }
                          />
                        </div>

                        {config.heroSection?.showSecondaryButton !== false && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t">
                            <div>
                              <Label className="text-[11px] font-semibold text-slate-500">Button Text</Label>
                              <Input
                                value={config.heroSection?.secondaryButtonText || ""}
                                onChange={(e) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    heroSection: { ...prev.heroSection, secondaryButtonText: e.target.value },
                                  }))
                                }
                                placeholder="e.g. Direct Inquiry or Chat on WhatsApp"
                                className="rounded-xl mt-1 text-xs font-medium h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-slate-500">Button Link</Label>
                              <Input
                                value={config.heroSection?.secondaryButtonLink || ""}
                                onChange={(e) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    heroSection: { ...prev.heroSection, secondaryButtonLink: e.target.value },
                                  }))
                                }
                                placeholder="e.g. #contact or #about"
                                className="rounded-xl mt-1 text-xs font-mono h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-slate-500">Button Icon</Label>
                              <select
                                value={config.heroSection?.secondaryButtonIcon || "message"}
                                onChange={(e) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    heroSection: { ...prev.heroSection, secondaryButtonIcon: e.target.value },
                                  }))
                                }
                                className="w-full h-9 px-3 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                              >
                                <option value="message">💬 Message / Chat</option>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="phone">📞 Phone / Call</option>
                                <option value="bag">🛍️ Shopping Bag</option>
                                <option value="eye">👁️ View Details</option>
                                <option value="none">None (Text Only)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HERO MEDIA & PHOTOS */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hero Photo &amp; Media</span>
                      </h4>

                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Main Hero Photo / Banner</Label>
                        <div className="mt-2 flex items-center gap-3">
                          {config.heroSection?.bgImage && (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border shadow-xs bg-slate-100">
                              <Image src={config.heroSection.bgImage} alt="Hero" fill className="object-cover" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm">
                              <CloudUpload className="w-3.5 h-3.5" />
                              <span>{config.heroSection?.bgImage ? "Change Hero Photo" : "Upload Hero Photo"}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "heroImage")} />
                            </label>
                            <p className="text-[10px] text-slate-400">High-resolution horizontal photo recommended (1920x1080 or 1200x800).</p>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* TRUST HIGHLIGHTS & FLOATING GUARANTEE CARD CUSTOMIZATION */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-5">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Trust Highlights &amp; Floating Guarantee Card
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Customize trust points (100% Genuine, Fast Delivery) and floating verification card
                          </p>
                        </div>
                      </div>

                      {/* 1. Quick Trust Badges */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs text-slate-700 dark:text-slate-300 font-bold block">
                              Show Trust Highlights
                            </Label>
                            <span className="text-[10px] text-slate-400">
                              Display guarantee badges under action buttons
                            </span>
                          </div>
                          <Switch
                            checked={config.heroSection?.showTrustBadges !== false}
                            onCheckedChange={(c) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, showTrustBadges: c },
                              }))
                            }
                          />
                        </div>

                        {config.heroSection?.showTrustBadges !== false && (
                          <div className="space-y-2 pt-1">
                            {(
                              config.heroSection?.trustBadges || [
                                { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                              ]
                            ).map((b: any, idx: number) => (
                              <div
                                key={b.id || idx}
                                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50"
                              >
                                <Switch
                                  checked={b.enabled !== false}
                                  onCheckedChange={(val) => {
                                    const current = [
                                      ...(config.heroSection?.trustBadges || [
                                        { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                        { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                        { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                                      ]),
                                    ];
                                    current[idx] = { ...current[idx], enabled: val };
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      heroSection: { ...prev.heroSection, trustBadges: current },
                                    }));
                                  }}
                                />

                                <select
                                  value={b.icon || "shield"}
                                  onChange={(e) => {
                                    const current = [
                                      ...(config.heroSection?.trustBadges || [
                                        { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                        { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                        { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                                      ]),
                                    ];
                                    current[idx] = { ...current[idx], icon: e.target.value };
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      heroSection: { ...prev.heroSection, trustBadges: current },
                                    }));
                                  }}
                                  className="h-8 px-2 rounded-lg border bg-white dark:bg-slate-800 text-xs font-semibold"
                                >
                                  <option value="shield">🛡️ Shield</option>
                                  <option value="truck">🚚 Truck</option>
                                  <option value="star">⭐️ Star</option>
                                  <option value="check">✅ Check</option>
                                  <option value="zap">⚡ Fast Zap</option>
                                  <option value="heart">🤝 Heart</option>
                                </select>

                                <Input
                                  value={b.text || ""}
                                  onChange={(e) => {
                                    const current = [
                                      ...(config.heroSection?.trustBadges || [
                                        { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                        { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                        { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                                      ]),
                                    ];
                                    current[idx] = { ...current[idx], text: e.target.value };
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      heroSection: { ...prev.heroSection, trustBadges: current },
                                    }));
                                  }}
                                  placeholder="e.g. 100% Genuine"
                                  className="h-8 rounded-lg text-xs font-bold flex-1"
                                />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const current = [
                                      ...(config.heroSection?.trustBadges || [
                                        { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                        { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                        { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                                      ]),
                                    ];
                                    current.splice(idx, 1);
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      heroSection: { ...prev.heroSection, trustBadges: current },
                                    }));
                                  }}
                                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = [
                                  ...(config.heroSection?.trustBadges || [
                                    { id: "b1", text: "100% Genuine", icon: "shield", enabled: true },
                                    { id: "b2", text: "Fast Delivery", icon: "truck", enabled: true },
                                    { id: "b3", text: "Top Rated", icon: "star", enabled: true },
                                  ]),
                                ];
                                current.push({
                                  id: "b-" + Date.now(),
                                  text: "New Guarantee",
                                  icon: "check",
                                  enabled: true,
                                });
                                setConfig((prev: any) => ({
                                  ...prev,
                                  heroSection: { ...prev.heroSection, trustBadges: current },
                                }));
                              }}
                              className="w-full text-xs font-bold rounded-xl border-dashed py-2"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              <span>Add Custom Trust Badge</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-slate-200/80 dark:bg-slate-700/80" />

                      {/* 2. Floating Guarantee Card */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs text-slate-700 dark:text-slate-300 font-bold block">
                              Show Floating Card on Hero Image
                            </Label>
                            <span className="text-[10px] text-slate-400">
                              Displays the floating verification badge over the store photo
                            </span>
                          </div>
                          <Switch
                            checked={config.heroSection?.showFloatingCard !== false}
                            onCheckedChange={(c) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                heroSection: { ...prev.heroSection, showFloatingCard: c },
                              }))
                            }
                          />
                        </div>

                        {config.heroSection?.showFloatingCard !== false && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                                Card Title
                              </Label>
                              <Input
                                value={config.heroSection?.floatingCardTitle ?? "Verified Seller"}
                                onChange={(e) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    heroSection: { ...prev.heroSection, floatingCardTitle: e.target.value },
                                  }))
                                }
                                placeholder="e.g. Verified Seller"
                                className="rounded-xl mt-1 text-xs font-bold"
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                                Card Subtitle
                              </Label>
                              <Input
                                value={
                                  config.heroSection?.floatingCardSubtitle ??
                                  "Islandwide Delivery & Support"
                                }
                                onChange={(e) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    heroSection: { ...prev.heroSection, floatingCardSubtitle: e.target.value },
                                  }))
                                }
                                placeholder="e.g. Islandwide Delivery & Support"
                                className="rounded-xl mt-1 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NAVBAR SHOW/HIDE TOGGLE */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show &apos;Home&apos; in Top Navbar</span>
                        <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                      </div>
                      <Switch
                        checked={getEffectiveNavItems().find((it: any) => it.id === "home")?.visible !== false}
                        onCheckedChange={(c) => handleUpdateNavItem("home", { visible: c })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PRODUCTS & MY ADS SHOWCASE (⚡ LIVE SYNCED WITH TRYME) */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  config.productsSection?.enabled !== false
                    ? "border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-emerald-950/25 dark:to-slate-900 border-l-4 border-l-emerald-600"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("products")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.productsSection?.enabled !== false
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Products &amp; Ads (Live Synced)</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          Catalog
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Automatic catalog items live synced from TryMe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.productsSection?.enabled !== false}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          productsSection: { ...(prev.productsSection || {}), enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("products")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["products"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["products"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["products"] && config.productsSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["products"] && (
                  <div className="space-y-4 pt-1">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {entityType === "ADS_SELLER" ? "My Ads Synced:" : "TryMe Products Synced:"} {products.length} Active Items
                        </span>
                      </div>
                      <a
                        href={entityType === "ADS_SELLER" ? "/ads-seller/my-ads" : "/vendor/products"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 underline hover:opacity-80"
                      >
                        <span>Manage in TryMe</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {config.productsSection?.enabled !== false && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-500 font-semibold">Section Heading</Label>
                          <Input
                            value={config.productsSection?.title || (entityType === "ADS_SELLER" ? "Active Ads & Services" : "Direct From Our Store")}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                productsSection: { ...(prev.productsSection || {}), title: e.target.value },
                              }))
                            }
                            className="rounded-xl mt-1 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 font-semibold">Section Subtitle</Label>
                          <Input
                            value={config.productsSection?.subtitle || "Browse verified catalog items and order directly via WhatsApp or visit our physical store."}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                productsSection: { ...(prev.productsSection || {}), subtitle: e.target.value },
                              }))
                            }
                            className="rounded-xl mt-1 text-xs"
                          />
                        </div>

                        {/* Top Navbar Link Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                            <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                          </div>
                          <Switch
                            checked={getEffectiveNavItems().find((it: any) => it.id === "products")?.visible !== false}
                            onCheckedChange={(c) => handleUpdateNavItem("products", { visible: c })}
                          />
                        </div>

                        {/* PRODUCT CARD DESIGN & ACTION BUTTONS CUSTOMIZATION (FULL WIDTH, CLEAN RESPONSIVE) */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
                              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Product Card Layout &amp; Action Buttons
                              </Label>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full w-fit ${
                              currentTier === "ONE_PAGE"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}>
                              {currentTier === "ONE_PAGE" ? "1-Page Mode (Inquiry/WhatsApp)" : "Multi-Page Mode (E-Commerce/Cart)"}
                            </span>
                          </div>

                          {/* Tier Notice */}
                          {currentTier === "ONE_PAGE" ? (
                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                              <strong>1-Page Website:</strong> Your website uses direct inquiry actions. Since 1-Page sites do not have dedicated cart/checkout sub-pages, cards trigger WhatsApp orders or quick inquiries directly.
                            </div>
                          ) : (
                            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                              <strong>{tierMeta.name}:</strong> Your multi-page site includes dedicated product detail pages, shopping cart, and full checkout with COD &amp; Bank Deposit.
                            </div>
                          )}

                          {/* Card Layout Selector */}
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Card Layout Style</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: "standard", name: "Standard", desc: "Clean & balanced" },
                                { id: "modern", name: "Modern", desc: "Soft rounded" },
                                { id: "compact", name: "Compact", desc: "Space-saving" },
                                { id: "bordered", name: "Bordered", desc: "Bold outline" },
                              ].map((l) => (
                                <button
                                  key={l.id}
                                  type="button"
                                  onClick={() =>
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      productsSection: { ...(prev.productsSection || {}), cardLayout: l.id },
                                    }))
                                  }
                                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 w-full min-h-[66px] ${
                                    (config.productsSection?.cardLayout || "standard") === l.id
                                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30"
                                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  <div className="font-bold text-xs leading-snug">{l.name}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{l.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Visual Elements Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="min-w-0 pr-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Price</span>
                                <span className="text-[10px] text-slate-500 block">Display price and discounts</span>
                              </div>
                              <Switch
                                className="shrink-0"
                                checked={config.productsSection?.showPrice !== false}
                                onCheckedChange={(c) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    productsSection: { ...(prev.productsSection || {}), showPrice: c },
                                  }))
                                }
                              />
                            </div>

                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="min-w-0 pr-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Badges</span>
                                <span className="text-[10px] text-slate-500 block">In Stock / % OFF / Verified</span>
                              </div>
                              <Switch
                                className="shrink-0"
                                checked={config.productsSection?.showBadge !== false}
                                onCheckedChange={(c) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    productsSection: { ...(prev.productsSection || {}), showBadge: c },
                                  }))
                                }
                              />
                            </div>

                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="min-w-0 pr-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Description</span>
                                <span className="text-[10px] text-slate-500 block">Display short item snippet</span>
                              </div>
                              <Switch
                                className="shrink-0"
                                checked={config.productsSection?.showDescription !== false}
                                onCheckedChange={(c) =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    productsSection: { ...(prev.productsSection || {}), showDescription: c },
                                  }))
                                }
                              />
                            </div>

                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="min-w-0 pr-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Image Display Mode</span>
                                <span className="text-[10px] text-slate-500 block">
                                  {(config.productsSection?.imageFit || "contain") === "contain" ? "Fit inside (Contain)" : "Fill container (Cover)"}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    productsSection: {
                                      ...(prev.productsSection || {}),
                                      imageFit: (prev.productsSection?.imageFit || "contain") === "contain" ? "cover" : "contain",
                                    },
                                  }))
                                }
                                className="h-7 text-xs font-bold shrink-0"
                              >
                                {(config.productsSection?.imageFit || "contain") === "contain" ? "Contain" : "Cover"}
                              </Button>
                            </div>
                          </div>

                          {/* Action Buttons Section */}
                          <div className="space-y-2 pt-1">
                            <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Card Action Buttons &amp; Custom Labels
                            </Label>

                            {currentTier === "ONE_PAGE" ? (
                              <div className="space-y-2.5">
                                {/* WhatsApp Button */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">WhatsApp Order Button</span>
                                    </div>
                                    <Switch
                                      className="shrink-0"
                                      checked={config.productsSection?.showWhatsApp !== false}
                                      onCheckedChange={(c) =>
                                        setConfig((prev: any) => ({
                                          ...prev,
                                          productsSection: { ...(prev.productsSection || {}), showWhatsApp: c },
                                        }))
                                      }
                                    />
                                  </div>
                                  {config.productsSection?.showWhatsApp !== false && (
                                    <div>
                                      <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                      <Input
                                        value={config.productsSection?.whatsappButtonText || "WhatsApp"}
                                        onChange={(e) =>
                                          setConfig((prev: any) => ({
                                            ...prev,
                                            productsSection: { ...(prev.productsSection || {}), whatsappButtonText: e.target.value },
                                          }))
                                        }
                                        placeholder="e.g. Order via WhatsApp"
                                        className="h-8 text-xs mt-1 w-full"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Inquiry Form Button */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Instant Inquiry / Quote Button</span>
                                    </div>
                                    <Switch
                                      className="shrink-0"
                                      checked={config.productsSection?.showInquiry !== false}
                                      onCheckedChange={(c) =>
                                        setConfig((prev: any) => ({
                                          ...prev,
                                          productsSection: { ...(prev.productsSection || {}), showInquiry: c },
                                        }))
                                      }
                                    />
                                  </div>
                                  {config.productsSection?.showInquiry !== false && (
                                    <div>
                                      <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                      <Input
                                        value={config.productsSection?.inquiryButtonText || "Inquire"}
                                        onChange={(e) =>
                                          setConfig((prev: any) => ({
                                            ...prev,
                                            productsSection: { ...(prev.productsSection || {}), inquiryButtonText: e.target.value },
                                          }))
                                        }
                                        placeholder="e.g. Send Inquiry"
                                        className="h-8 text-xs mt-1 w-full"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {/* Add to Cart Button */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ShoppingCart className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Add to Cart Button</span>
                                    </div>
                                    <Switch
                                      className="shrink-0"
                                      checked={config.productsSection?.showAddToCart !== false}
                                      onCheckedChange={(c) =>
                                        setConfig((prev: any) => ({
                                          ...prev,
                                          productsSection: { ...(prev.productsSection || {}), showAddToCart: c },
                                        }))
                                      }
                                    />
                                  </div>
                                  {config.productsSection?.showAddToCart !== false && (
                                    <div>
                                      <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                      <Input
                                        value={config.productsSection?.cartButtonText || "Add to Cart"}
                                        onChange={(e) =>
                                          setConfig((prev: any) => ({
                                            ...prev,
                                            productsSection: { ...(prev.productsSection || {}), cartButtonText: e.target.value },
                                          }))
                                        }
                                        placeholder="e.g. Add to Cart"
                                        className="h-8 text-xs mt-1 w-full"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Buy Now Button */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Buy Now Button</span>
                                    </div>
                                    <Switch
                                      className="shrink-0"
                                      checked={config.productsSection?.showBuyNow !== false}
                                      onCheckedChange={(c) =>
                                        setConfig((prev: any) => ({
                                          ...prev,
                                          productsSection: { ...(prev.productsSection || {}), showBuyNow: c },
                                        }))
                                      }
                                    />
                                  </div>
                                  {config.productsSection?.showBuyNow !== false && (
                                    <div>
                                      <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                      <Input
                                        value={config.productsSection?.buyNowButtonText || "Buy Now"}
                                        onChange={(e) =>
                                          setConfig((prev: any) => ({
                                            ...prev,
                                            productsSection: { ...(prev.productsSection || {}), buyNowButtonText: e.target.value },
                                          }))
                                        }
                                        placeholder="e.g. Buy Now"
                                        className="h-8 text-xs mt-1 w-full"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* View Details Link */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">View Details Button</span>
                                    </div>
                                    <Switch
                                      className="shrink-0"
                                      checked={config.productsSection?.showViewDetails !== false}
                                      onCheckedChange={(c) =>
                                        setConfig((prev: any) => ({
                                          ...prev,
                                          productsSection: { ...(prev.productsSection || {}), showViewDetails: c },
                                        }))
                                      }
                                    />
                                  </div>
                                  {config.productsSection?.showViewDetails !== false && (
                                    <div>
                                      <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                      <Input
                                        value={config.productsSection?.detailsButtonText || "View Details"}
                                        onChange={(e) =>
                                          setConfig((prev: any) => ({
                                            ...prev,
                                            productsSection: { ...(prev.productsSection || {}), detailsButtonText: e.target.value },
                                          }))
                                        }
                                        placeholder="e.g. View Details"
                                        className="h-8 text-xs mt-1 w-full"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Optional Direct WhatsApp in Multi-page */}
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                                  <div className="min-w-0 pr-1">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Direct WhatsApp Button on Cards</span>
                                    <span className="text-[10px] text-slate-400 block">Allow customers to also message via WhatsApp directly from the product card</span>
                                  </div>
                                  <Switch
                                    className="shrink-0"
                                    checked={Boolean(config.productsSection?.showMultiPageWhatsApp)}
                                    onCheckedChange={(c) =>
                                      setConfig((prev: any) => ({
                                        ...prev,
                                        productsSection: { ...(prev.productsSection || {}), showMultiPageWhatsApp: c },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SERVICES SECTION */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  config.servicesSection?.enabled !== false
                    ? "border-amber-200/90 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/25 dark:to-slate-900 border-l-4 border-l-amber-500"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("services")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.servicesSection?.enabled !== false
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Services &amp; Offerings</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          Bespoke
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Custom services, tailoring, repairs &amp; packages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.servicesSection?.enabled !== false}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          servicesSection: { ...prev.servicesSection, enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("services")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["services"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["services"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["services"] && config.servicesSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["services"] && config.servicesSection?.enabled !== false && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Section Title</Label>
                      <Input
                        value={config.servicesSection?.title || "Featured Services"}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            servicesSection: { ...prev.servicesSection, title: e.target.value },
                          }))
                        }
                        className="rounded-xl mt-1 text-sm font-medium"
                      />
                    </div>

                    {/* Services Items List */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Custom Service Cards</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const items = [...(config.servicesSection?.items || [])];
                            items.push({
                              id: "srv-" + Date.now(),
                              name: "New Service",
                              price: "Rs. 1,500",
                              description: "Service description and details...",
                            });
                            setConfig((prev: any) => ({
                              ...prev,
                              servicesSection: { ...(prev.servicesSection || {}), items },
                            }));
                          }}
                          className="h-7 text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Service
                        </Button>
                      </div>

                      {(config.servicesSection?.items || []).map((srv: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Service #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = (config.servicesSection?.items || []).filter((_: any, i: number) => i !== idx);
                                setConfig((prev: any) => ({
                                  ...prev,
                                  servicesSection: { ...(prev.servicesSection || {}), items: filtered },
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Service Name"
                              value={srv.name || ""}
                              onChange={(e) => {
                                const items = [...(config.servicesSection?.items || [])];
                                items[idx] = { ...items[idx], name: e.target.value };
                                setConfig((prev: any) => ({ ...prev, servicesSection: { ...prev.servicesSection, items } }));
                              }}
                              className="text-xs h-8"
                            />
                            <Input
                              placeholder="Price (e.g. Rs. 2,500)"
                              value={srv.price || ""}
                              onChange={(e) => {
                                const items = [...(config.servicesSection?.items || [])];
                                items[idx] = { ...items[idx], price: e.target.value };
                                setConfig((prev: any) => ({ ...prev, servicesSection: { ...prev.servicesSection, items } }));
                              }}
                              className="text-xs h-8"
                            />
                          </div>
                          <Textarea
                            placeholder="Service Description"
                            value={srv.description || ""}
                            onChange={(e) => {
                              const items = [...(config.servicesSection?.items || [])];
                              items[idx] = { ...items[idx], description: e.target.value };
                              setConfig((prev: any) => ({ ...prev, servicesSection: { ...prev.servicesSection, items } }));
                            }}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Top Navbar Link Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                        <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                      </div>
                      <Switch
                        checked={getEffectiveNavItems().find((it: any) => it.id === "services")?.visible !== false}
                        onCheckedChange={(c) => handleUpdateNavItem("services", { visible: c })}
                      />
                    </div>

                    {/* SERVICES CARD DESIGN & ACTION BUTTONS CUSTOMIZATION (FULL WIDTH, CLEAN RESPONSIVE) */}
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Service Card Layout &amp; Action Buttons
                          </Label>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full w-fit ${
                          currentTier === "ONE_PAGE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}>
                          {currentTier === "ONE_PAGE" ? "1-Page Mode (Inquiry/WhatsApp)" : "Multi-Page Mode"}
                        </span>
                      </div>

                      {/* Card Layout Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Card Layout Style</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "standard", name: "Standard", desc: "Clean & balanced" },
                            { id: "modern", name: "Modern", desc: "Soft rounded" },
                            { id: "compact", name: "Compact", desc: "Space-saving" },
                            { id: "bordered", name: "Bordered", desc: "Bold outline" },
                          ].map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  servicesSection: { ...(prev.servicesSection || {}), cardLayout: l.id },
                                }))
                              }
                              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 w-full min-h-[66px] ${
                                (config.servicesSection?.cardLayout || "standard") === l.id
                                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="font-bold text-xs leading-snug">{l.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{l.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visual Elements Toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                          <div className="min-w-0 pr-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Price</span>
                            <span className="text-[10px] text-slate-500 block">Display package rate</span>
                          </div>
                          <Switch
                            className="shrink-0"
                            checked={config.servicesSection?.showPrice !== false}
                            onCheckedChange={(c) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                servicesSection: { ...(prev.servicesSection || {}), showPrice: c },
                              }))
                            }
                          />
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                          <div className="min-w-0 pr-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Description</span>
                            <span className="text-[10px] text-slate-500 block">Display details snippet</span>
                          </div>
                          <Switch
                            className="shrink-0"
                            checked={config.servicesSection?.showDescription !== false}
                            onCheckedChange={(c) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                servicesSection: { ...(prev.servicesSection || {}), showDescription: c },
                              }))
                            }
                          />
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 sm:col-span-2">
                          <div className="min-w-0 pr-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Image Display Mode</span>
                            <span className="text-[10px] text-slate-500 block">
                              {(config.servicesSection?.imageFit || "contain") === "contain" ? "Fit inside (Contain)" : "Fill container (Cover)"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setConfig((prev: any) => ({
                                ...prev,
                                servicesSection: {
                                  ...(prev.servicesSection || {}),
                                  imageFit: (prev.servicesSection?.imageFit || "contain") === "contain" ? "cover" : "contain",
                                },
                              }))
                            }
                            className="h-7 text-xs font-bold shrink-0"
                          >
                            {(config.servicesSection?.imageFit || "contain") === "contain" ? "Contain" : "Cover"}
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons Section */}
                      <div className="space-y-2 pt-1">
                        <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Service Card Action Buttons &amp; Custom Labels
                        </Label>

                        {currentTier === "ONE_PAGE" ? (
                          <div className="space-y-2.5">
                            {/* WhatsApp Button */}
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">WhatsApp Booking Button</span>
                                </div>
                                <Switch
                                  className="shrink-0"
                                  checked={config.servicesSection?.showWhatsApp !== false}
                                  onCheckedChange={(c) =>
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      servicesSection: { ...(prev.servicesSection || {}), showWhatsApp: c },
                                    }))
                                  }
                                />
                              </div>
                              {config.servicesSection?.showWhatsApp !== false && (
                                <div>
                                  <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                  <Input
                                    value={config.servicesSection?.whatsappButtonText || "WhatsApp"}
                                    onChange={(e) =>
                                      setConfig((prev: any) => ({
                                        ...prev,
                                        servicesSection: { ...(prev.servicesSection || {}), whatsappButtonText: e.target.value },
                                      }))
                                    }
                                    placeholder="e.g. Book via WhatsApp"
                                    className="h-8 text-xs mt-1 w-full"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Inquiry Form Button */}
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Inquiry / Booking Form Button</span>
                                </div>
                                <Switch
                                  className="shrink-0"
                                  checked={config.servicesSection?.showInquiry !== false}
                                  onCheckedChange={(c) =>
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      servicesSection: { ...(prev.servicesSection || {}), showInquiry: c },
                                    }))
                                  }
                                />
                              </div>
                              {config.servicesSection?.showInquiry !== false && (
                                <div>
                                  <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                  <Input
                                    value={config.servicesSection?.inquiryButtonText || "Inquire"}
                                    onChange={(e) =>
                                      setConfig((prev: any) => ({
                                        ...prev,
                                        servicesSection: { ...(prev.servicesSection || {}), inquiryButtonText: e.target.value },
                                      }))
                                    }
                                    placeholder="e.g. Inquire / Book"
                                    className="h-8 text-xs mt-1 w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {/* Book Now Button */}
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Book / Order Button</span>
                                </div>
                                <Switch
                                  className="shrink-0"
                                  checked={config.servicesSection?.showBookNow !== false}
                                  onCheckedChange={(c) =>
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      servicesSection: { ...(prev.servicesSection || {}), showBookNow: c },
                                    }))
                                  }
                                />
                              </div>
                              {config.servicesSection?.showBookNow !== false && (
                                <div>
                                  <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                  <Input
                                    value={config.servicesSection?.bookButtonText || "Book / Order"}
                                    onChange={(e) =>
                                      setConfig((prev: any) => ({
                                        ...prev,
                                        servicesSection: { ...(prev.servicesSection || {}), bookButtonText: e.target.value },
                                      }))
                                    }
                                    placeholder="e.g. Book Service"
                                    className="h-8 text-xs mt-1 w-full"
                                  />
                                </div>
                              )}
                            </div>

                            {/* View Details Link */}
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">View Details Button</span>
                                </div>
                                <Switch
                                  className="shrink-0"
                                  checked={config.servicesSection?.showViewDetails !== false}
                                  onCheckedChange={(c) =>
                                    setConfig((prev: any) => ({
                                      ...prev,
                                      servicesSection: { ...(prev.servicesSection || {}), showViewDetails: c },
                                    }))
                                  }
                                />
                              </div>
                              {config.servicesSection?.showViewDetails !== false && (
                                <div>
                                  <Label className="text-[10px] font-semibold text-slate-500">Button Label / Text</Label>
                                  <Input
                                    value={config.servicesSection?.detailsButtonText || "View Details"}
                                    onChange={(e) =>
                                      setConfig((prev: any) => ({
                                        ...prev,
                                        servicesSection: { ...(prev.servicesSection || {}), detailsButtonText: e.target.value },
                                      }))
                                    }
                                    placeholder="e.g. View Details"
                                    className="h-8 text-xs mt-1 w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ABOUT SECTION */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  config.aboutSection?.enabled !== false
                    ? "border-purple-200/90 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/70 via-white to-white dark:from-purple-950/25 dark:to-slate-900 border-l-4 border-l-purple-600"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("about")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.aboutSection?.enabled !== false
                          ? "bg-purple-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">About Section</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                          Story &amp; Trust
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Brand story, mission, photos and why customers choose you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.aboutSection?.enabled !== false}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          aboutSection: { ...(prev.aboutSection || {}), enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("about")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["about"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["about"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["about"] && config.aboutSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["about"] && config.aboutSection?.enabled !== false && (
                  <div className="space-y-4 pt-2">
                    {/* Badge */}
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Badge Pill Subtitle</Label>
                      <Input
                        value={config.aboutSection?.badge || "ABOUT US"}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            aboutSection: { ...(prev.aboutSection || {}), badge: e.target.value },
                          }))
                        }
                        placeholder="e.g. ABOUT US, WHO WE ARE, OUR STORY"
                        className="rounded-xl mt-1 text-xs font-bold uppercase"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Heading Title</Label>
                      <Input
                        value={config.aboutSection?.title || ""}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            aboutSection: { ...(prev.aboutSection || {}), title: e.target.value },
                          }))
                        }
                        placeholder="e.g. More Than Just a Store"
                        className="rounded-xl mt-1 text-sm font-bold"
                      />
                    </div>

                    {/* Story / Description */}
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Our Story / Description</Label>
                      <Textarea
                        rows={4}
                        value={config.aboutSection?.content || ""}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            aboutSection: { ...(prev.aboutSection || {}), content: e.target.value },
                          }))
                        }
                        placeholder="Tell your brand story, what makes your products/services special, and why customers trust you..."
                        className="rounded-xl mt-1 text-xs leading-relaxed"
                      />
                    </div>

                    {/* About Us Photo Upload */}
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">About Us Photo</Label>
                      <div className="mt-2 space-y-2">
                        {config.aboutSection?.images?.[0] ? (
                          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border shadow-sm group">
                            <Image
                              src={config.aboutSection.images[0]}
                              alt="About Us"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow flex items-center gap-1.5">
                                <CloudUpload className="w-3.5 h-3.5" />
                                <span>Change Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, "aboutImage")}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    aboutSection: { ...(prev.aboutSection || {}), images: [] },
                                  }))
                                }
                                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                              <CloudUpload className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Click to Upload About Photo
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Upload a photo of your shop, team, or workshop (PNG, JPG)
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "aboutImage")}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Key Highlights / Features */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Highlights &amp; Trust Badges
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentH = config.aboutSection?.highlights || [
                              "100% Genuine Products",
                              "Fast Islandwide Delivery",
                              "Friendly WhatsApp Support",
                            ];
                            setConfig((prev: any) => ({
                              ...prev,
                              aboutSection: {
                                ...(prev.aboutSection || {}),
                                highlights: [...currentH, "New Highlight Point"],
                              },
                            }));
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Point
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(config.aboutSection?.highlights || [
                          "100% Genuine Products",
                          "Fast Islandwide Delivery",
                          "Friendly WhatsApp Support",
                        ]).map((h: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={h}
                              onChange={(e) => {
                                const currentH = [
                                  ...(config.aboutSection?.highlights || [
                                    "100% Genuine Products",
                                    "Fast Islandwide Delivery",
                                    "Friendly WhatsApp Support",
                                  ]),
                                ];
                                currentH[idx] = e.target.value;
                                setConfig((prev: any) => ({
                                  ...prev,
                                  aboutSection: { ...(prev.aboutSection || {}), highlights: currentH },
                                }));
                              }}
                              placeholder="e.g. 100% Guaranteed Quality"
                              className="h-8 text-xs font-semibold rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentH = (config.aboutSection?.highlights || [
                                  "100% Genuine Products",
                                  "Fast Islandwide Delivery",
                                  "Friendly WhatsApp Support",
                                ]).filter((_: any, i: number) => i !== idx);
                                setConfig((prev: any) => ({
                                  ...prev,
                                  aboutSection: { ...(prev.aboutSection || {}), highlights: currentH },
                                }));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Button Text */}
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-slate-500 font-semibold">WhatsApp Button Text</Label>
                      <Input
                        value={config.aboutSection?.buttonText || "Inquire via WhatsApp"}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            aboutSection: { ...(prev.aboutSection || {}), buttonText: e.target.value },
                          }))
                        }
                        placeholder="e.g. Chat on WhatsApp / Learn More"
                        className="rounded-xl mt-1 text-xs font-semibold"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                        <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                      </div>
                      <Switch
                        checked={getEffectiveNavItems().find((it: any) => it.id === "about")?.visible !== false}
                        onCheckedChange={(c) => handleUpdateNavItem("about", { visible: c })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GALLERY SECTION */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  Boolean(config.gallerySection?.enabled)
                    ? "border-rose-200/90 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/70 via-white to-white dark:from-rose-950/25 dark:to-slate-900 border-l-4 border-l-rose-500"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("gallery")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        Boolean(config.gallerySection?.enabled)
                          ? "bg-rose-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Gallery Showcase</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                          Photos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Showcase store photos, work samples and product collections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={Boolean(config.gallerySection?.enabled)}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          gallerySection: { ...(prev.gallerySection || {}), enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("gallery")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["gallery"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["gallery"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["gallery"] && !Boolean(config.gallerySection?.enabled) && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["gallery"] && Boolean(config.gallerySection?.enabled) && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Gallery Title</Label>
                      <Input
                        value={config.gallerySection?.title || "A Glimpse of Our Work"}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            gallerySection: { ...(prev.gallerySection || {}), title: e.target.value },
                          }))
                        }
                        className="rounded-xl mt-1 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-bold text-slate-700">Gallery Photos</Label>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm">
                          <Plus className="w-3 h-3" />
                          <span>Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, "gallery")}
                          />
                        </label>
                      </div>

                      {(config.gallerySection?.images || []).length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {(config.gallerySection?.images || []).map((imgUrl: string, idx: number) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border group">
                              <Image src={imgUrl} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = (config.gallerySection?.images || []).filter(
                                    (_: any, i: number) => i !== idx
                                  );
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    gallerySection: { ...(prev.gallerySection || {}), images: filtered },
                                  }));
                                }}
                                className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed rounded-xl text-center text-xs text-slate-400">
                          No gallery photos uploaded yet. Click &quot;Add Photo&quot; above.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                        <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                      </div>
                      <Switch
                        checked={getEffectiveNavItems().find((it: any) => it.id === "gallery")?.visible !== false}
                        onCheckedChange={(c) => handleUpdateNavItem("gallery", { visible: c })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* REVIEWS & TESTIMONIALS */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  Boolean(config.reviewsSection?.enabled)
                    ? "border-amber-300/80 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/25 dark:to-slate-900 border-l-4 border-l-amber-500"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("reviews")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        Boolean(config.reviewsSection?.enabled)
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Customer Reviews &amp; Testimonials</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          Reviews
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Customer ratings, feedback &amp; trust testimonials</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={Boolean(config.reviewsSection?.enabled)}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          reviewsSection: { ...(prev.reviewsSection || {}), enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("reviews")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["reviews"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["reviews"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["reviews"] && !Boolean(config.reviewsSection?.enabled) && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["reviews"] && Boolean(config.reviewsSection?.enabled) && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Section Title</Label>
                      <Input
                        value={config.reviewsSection?.title || "What Our Customers Say"}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            reviewsSection: { ...(prev.reviewsSection || {}), title: e.target.value },
                          }))
                        }
                        className="rounded-xl mt-1 text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700">Testimonials List</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentItems = config.reviewsSection?.items || [];
                            setConfig((prev: any) => ({
                              ...prev,
                              reviewsSection: {
                                ...(prev.reviewsSection || {}),
                                items: [
                                  ...currentItems,
                                  { name: "Customer Name", comment: "Great product and super fast delivery!" },
                                ],
                              },
                            }));
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Review
                        </Button>
                      </div>

                      {(config.reviewsSection?.items || []).map((rev: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">Review #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = (config.reviewsSection?.items || []).filter(
                                  (_: any, i: number) => i !== idx
                                );
                                setConfig((prev: any) => ({
                                  ...prev,
                                  reviewsSection: { ...(prev.reviewsSection || {}), items: filtered },
                                }));
                              }}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>
                          <Input
                            placeholder="Customer Name"
                            value={rev.name || ""}
                            onChange={(e) => {
                              const items = [...(config.reviewsSection?.items || [])];
                              items[idx] = { ...items[idx], name: e.target.value };
                              setConfig((prev: any) => ({
                                ...prev,
                                reviewsSection: { ...prev.reviewsSection, items },
                              }));
                            }}
                            className="h-8 text-xs font-bold"
                          />
                          <Textarea
                            rows={2}
                            placeholder="Review Comment..."
                            value={rev.comment || ""}
                            onChange={(e) => {
                              const items = [...(config.reviewsSection?.items || [])];
                              items[idx] = { ...items[idx], comment: e.target.value };
                              setConfig((prev: any) => ({
                                ...prev,
                                reviewsSection: { ...prev.reviewsSection, items },
                              }));
                            }}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                        <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                      </div>
                      <Switch
                        checked={getEffectiveNavItems().find((it: any) => it.id === "reviews")?.visible !== false}
                        onCheckedChange={(c) => handleUpdateNavItem("reviews", { visible: c })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CONTACT US & LOCATION SECTION */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  config.contactSection?.enabled !== false
                    ? "border-teal-200/90 dark:border-teal-900/60 bg-gradient-to-b from-teal-50/70 via-white to-white dark:from-teal-950/25 dark:to-slate-900 border-l-4 border-l-teal-600"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("contact")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.contactSection?.enabled !== false
                          ? "bg-teal-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Contact Us &amp; Location</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                          Inquiry
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Physical address, phone, email, Google Maps &amp; opening hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.contactSection?.enabled !== false}
                      onCheckedChange={(c) => handleUpdateContactSection({ enabled: c })}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("contact")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["contact"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["contact"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["contact"] && config.contactSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["contact"] && config.contactSection?.enabled !== false && (
                  <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Section Heading</Label>
                      <Input
                        value={config.contactSection?.title || "Visit Us or Connect"}
                        onChange={(e) => handleUpdateContactSection({ title: e.target.value })}
                        placeholder="e.g. Get in Touch"
                        className="rounded-xl mt-1 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Section Subtitle</Label>
                      <Input
                        value={config.contactSection?.subtitle || "We would love to hear from you."}
                        onChange={(e) => handleUpdateContactSection({ subtitle: e.target.value })}
                        placeholder="Subtitle text"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Direct Contact Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">WhatsApp Number</Label>
                      <Input
                        value={config.contactSection?.whatsapp || ""}
                        onChange={(e) => handleUpdateContactSection({ whatsapp: e.target.value })}
                        placeholder="e.g. 0765731249"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Direct Phone Call</Label>
                      <Input
                        value={config.contactSection?.phone || ""}
                        onChange={(e) => handleUpdateContactSection({ phone: e.target.value })}
                        placeholder="e.g. 0112345678"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Email Address</Label>
                      <Input
                        value={config.contactSection?.email || ""}
                        onChange={(e) => handleUpdateContactSection({ email: e.target.value })}
                        placeholder="hello@yourstore.lk"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Physical Shop Address</Label>
                      <Input
                        value={config.contactSection?.address || ""}
                        onChange={(e) => handleUpdateContactSection({ address: e.target.value })}
                        placeholder="e.g. 644/B Kajuhena Road, Heiyanthuduwa"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* CONTACT DETAILS CARDS OPTION */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Show Direct Contact Cards (Phone, WhatsApp, Email, Location)
                        </span>
                      </div>
                      <Switch
                        checked={config.contactSection?.showContactCards !== false}
                        onCheckedChange={(c) => handleUpdateContactSection({ showContactCards: c })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Display interactive direct call, WhatsApp chat, email, and address info cards.
                    </p>
                  </div>

                  {/* OPENING HOURS OPTION */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Show Opening / Working Hours
                        </span>
                      </div>
                      <Switch
                        checked={config.contactSection?.showOpeningHours !== false}
                        onCheckedChange={(c) => handleUpdateContactSection({ showOpeningHours: c })}
                      />
                    </div>
                    {config.contactSection?.showOpeningHours !== false && (
                      <div>
                        <Label className="text-[11px] text-slate-400">Hours Schedule (e.g. Days &amp; Times)</Label>
                        <Textarea
                          rows={2}
                          value={
                            config.contactSection?.openingHours ??
                            "Monday – Saturday: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 5:00 PM"
                          }
                          onChange={(e) => handleUpdateContactSection({ openingHours: e.target.value })}
                          placeholder="e.g. Mon - Sat: 9:00 AM - 8:00 PM&#10;Sunday: 10:00 AM - 5:00 PM"
                          className="rounded-lg mt-1 text-xs resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* GOOGLE MAPS / LOCATION OPTION */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Show Google Maps Location
                        </span>
                      </div>
                      <Switch
                        checked={Boolean(config.contactSection?.showMap)}
                        onCheckedChange={(c) => handleUpdateContactSection({ showMap: c })}
                      />
                    </div>
                    {config.contactSection?.showMap && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-slate-400">
                          Interactive map will automatically display your shop address. You can also provide a custom Google Map embed URL.
                        </p>
                        <div>
                          <Label className="text-[11px] text-slate-400">Custom Google Maps Embed URL (Optional)</Label>
                          <Input
                            value={config.contactSection?.mapEmbedUrl || ""}
                            onChange={(e) => handleUpdateContactSection({ mapEmbedUrl: e.target.value })}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                            className="rounded-lg mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-400">Directions Link (Optional)</Label>
                          <Input
                            value={config.contactSection?.mapDirectionsUrl || ""}
                            onChange={(e) => handleUpdateContactSection({ mapDirectionsUrl: e.target.value })}
                            placeholder="https://maps.app.goo.gl/..."
                            className="rounded-lg mt-1 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONTACT / INQUIRY FORM OPTION */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Enable Contact / Inquiry Form
                        </span>
                      </div>
                      <Switch
                        checked={config.contactSection?.showContactForm !== false}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            contactSection: { ...(prev.contactSection || {}), showContactForm: c },
                          }))
                        }
                      />
                    </div>
                    {config.contactSection?.showContactForm !== false && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-slate-400">
                          Visitors can submit their Name, Phone, and Message directly or send via WhatsApp with 1-click.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px] text-slate-400">Form Title</Label>
                            <Input
                              value={config.contactSection?.formTitle || "Send Us a Message"}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  contactSection: { ...(prev.contactSection || {}), formTitle: e.target.value },
                                }))
                              }
                              className="rounded-lg mt-1 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-slate-400">Form Subtitle</Label>
                            <Input
                              value={config.contactSection?.formSubtitle || "We will get back to you promptly."}
                              onChange={(e) =>
                                setConfig((prev: any) => ({
                                  ...prev,
                                  contactSection: { ...(prev.contactSection || {}), formSubtitle: e.target.value },
                                }))
                              }
                              className="rounded-lg mt-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Link in Top Navbar</span>
                      <span className="text-[10px] text-slate-500 block">Show or hide the link in the top navigation bar while keeping the section on the page</span>
                    </div>
                    <Switch
                      checked={getEffectiveNavItems().find((it: any) => it.id === "contact")?.visible !== false}
                      onCheckedChange={(c) => handleUpdateNavItem("contact", { visible: c })}
                    />
                  </div>
                </div>
                )}
              </div>

              {/* RICH CUSTOMIZABLE FOOTER */}
              <div
                className={`rounded-2xl border-2 transition-all p-4 md:p-5 space-y-4 shadow-xs ${
                  config.footerSection?.enabled !== false
                    ? "border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-100/70 via-white to-white dark:from-slate-800/40 dark:to-slate-900 border-l-4 border-l-slate-700"
                    : "border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-75"
                }`}
              >
                <div
                  className="flex items-center justify-between pb-1 cursor-pointer select-none"
                  onClick={() => toggleSectionOpen("footer")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        config.footerSection?.enabled !== false
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Footer &amp; Navigation Columns</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                          Footer
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Store bio, navigation links, copyright notice &amp; payment badges</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={config.footerSection?.enabled !== false}
                      onCheckedChange={(c) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          footerSection: { ...(prev.footerSection || {}), enabled: c },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleSectionOpen("footer")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title={openSections["footer"] ? "Collapse section" : "Expand section details"}
                    >
                      {openSections["footer"] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {openSections["footer"] && config.footerSection?.enabled === false && (
                  <p className="text-[11px] font-bold text-slate-400 italic pt-1">
                    This section is currently disabled and hidden from your website.
                  </p>
                )}

                {openSections["footer"] && config.footerSection?.enabled !== false && (
                  <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Store Bio / Description (Footer Column 1)</Label>
                    <Textarea
                      rows={2}
                      value={config.footerSection?.storeBio || ""}
                      onChange={(e) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          footerSection: { ...(prev.footerSection || {}), storeBio: e.target.value },
                        }))
                      }
                      placeholder="e.g. Your trusted destination for curated high quality clothing and accessories in Sri Lanka."
                      className="rounded-xl mt-1 text-xs resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500 font-semibold">Copyright Notice</Label>
                    <Input
                      value={config.footerSection?.copyrightText || ""}
                      onChange={(e) =>
                        setConfig((prev: any) => ({
                          ...prev,
                          footerSection: { ...(prev.footerSection || {}), copyrightText: e.target.value },
                        }))
                      }
                      placeholder={`© ${new Date().getFullYear()} ${entityInfo?.businessName || "Store"}. All rights reserved.`}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  {/* Social Links Group */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-3">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Social Media Profiles
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-slate-400">Facebook URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.facebook || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), facebook: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://facebook.com/..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Instagram URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.instagram || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), instagram: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://instagram.com/..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">TikTok URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.tiktok || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), tiktok: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://tiktok.com/@..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">YouTube URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.youtube || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), youtube: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://youtube.com/@..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Twitter / X URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.twitter || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), twitter: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://x.com/..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">LinkedIn URL</Label>
                        <Input
                          value={config.footerSection?.socialLinks?.linkedin || ""}
                          onChange={(e) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: {
                                ...(prev.footerSection || {}),
                                socialLinks: { ...(prev.footerSection?.socialLinks || {}), linkedin: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://linkedin.com/in/..."
                          className="rounded-lg mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Content Columns Toggles */}
                  <div className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-3">
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      Footer Navigation &amp; Content Columns
                    </Label>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                          Website Section Links (Quick Links)
                        </span>
                        <span className="text-[10px] text-slate-400">Home, Products, About, Gallery, Contact</span>
                      </div>
                      <Switch
                        checked={config.footerSection?.showQuickLinks !== false}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            footerSection: { ...(prev.footerSection || {}), showQuickLinks: c },
                          }))
                        }
                      />
                    </div>

                    <div className="pt-1 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                            Custom Pages &amp; Policies Links
                          </span>
                          <span className="text-[10px] text-slate-400">Show created pages in Footer (About Us, Privacy, Support, etc.)</span>
                        </div>
                        <Switch
                          checked={config.footerSection?.showPagesLinks !== false}
                          onCheckedChange={(c) => {
                            const updated = {
                              ...config,
                              footerSection: { ...(config.footerSection || {}), showPagesLinks: c },
                            };
                            setConfig(updated);
                            autoSaveConfig(updated);
                          }}
                        />
                      </div>

                      {config.footerSection?.showPagesLinks !== false && pages.length > 0 && (
                        <div className="pl-2 pt-1.5 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Choose Which Pages Appear in Footer:
                          </span>
                          {pages.map((p) => {
                            const inFooter = isCustomPageInFooter(p);
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3 h-3 text-primary shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {p.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">/{p.slug}</span>
                                </div>
                                <Switch
                                  checked={inFooter}
                                  onCheckedChange={(val) => handleToggleCustomPageInFooter(p, val)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                          Show Contact &amp; Hours in Footer
                        </span>
                        <span className="text-[10px] text-slate-400">Displays address, phone, and opening hours</span>
                      </div>
                      <Switch
                        checked={config.footerSection?.showContactInfo !== false}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            footerSection: { ...(prev.footerSection || {}), showContactInfo: c },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                          Newsletter Subscription Box
                        </span>
                        <span className="text-[10px] text-slate-400">Allow visitors to subscribe for offers &amp; updates</span>
                      </div>
                      <Switch
                        checked={Boolean(config.footerSection?.showNewsletter)}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            footerSection: { ...(prev.footerSection || {}), showNewsletter: c },
                          }))
                        }
                      />
                    </div>

                    {/* Powered By Branding Customization */}
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Show "Powered by" Footer Badge
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Display platform credit or your own custom footer credit
                          </span>
                        </div>
                        <Switch
                          checked={config.footerSection?.showPoweredBy !== false}
                          onCheckedChange={(c) =>
                            setConfig((prev: any) => ({
                              ...prev,
                              footerSection: { ...(prev.footerSection || {}), showPoweredBy: c },
                            }))
                          }
                        />
                      </div>

                      {config.footerSection?.showPoweredBy !== false && (
                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500">Custom "Powered By" Text (Optional)</Label>
                          <Input
                            value={config.footerSection?.poweredByText || ""}
                            onChange={(e) =>
                              setConfig((prev: any) => ({
                                ...prev,
                                footerSection: { ...(prev.footerSection || {}), poweredByText: e.target.value },
                              }))
                            }
                            placeholder="e.g. Powered by TryMe Stores or Powered by Fashion Dora"
                            className="h-8 text-xs mt-1 w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: NAVBAR & MENU CUSTOMIZER */}
            <TabsContent value="menu" className="space-y-6 pt-4">
              {/* Plan Mode Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  currentTier === "ONE_PAGE"
                    ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                    : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                } space-y-2`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Menu className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Navbar &amp; Menu Customizer
                    </h3>
                  </div>
                  <Badge
                    className={`${
                      currentTier === "ONE_PAGE"
                        ? "bg-amber-500 text-white font-bold text-[10px]"
                        : "bg-emerald-600 text-white font-bold text-[10px]"
                    } shrink-0 whitespace-nowrap`}
                  >
                    {currentTier === "ONE_PAGE" ? "1-Page Scroll Mode" : "Multi-Page Mode Unlocked"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentTier === "ONE_PAGE" ? (
                    <>
                      In your <strong>1-Page Plan</strong>, navbar buttons smoothly scroll visitors down to that section on your homepage. You can customize button labels and show/hide items. To unlock dedicated standalone pages, upgrade to the <strong>6-Page or 12-Page Plan</strong>.
                    </>
                  ) : (
                    <>
                      In your <strong>{tierMeta.name}</strong>, you have full flexibility: choose per button whether it smooth-scrolls on the homepage or opens in its own dedicated page view!
                    </>
                  )}
                </p>
              </div>

              {/* CATALOG / MY ADS HIGHLIGHT CARD */}
              <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary text-white shadow-sm">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {entityType === "ADS_SELLER" ? "My Ads / Classifieds Page" : "Store Products Catalog"}
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        Live synced from your TryMe dashboard ({products.length} items)
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={getEffectiveNavItems().find((it: any) => it.id === "products")?.visible !== false}
                    onCheckedChange={(c) => handleUpdateNavItem("products", { visible: c })}
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Navbar Display Name
                    </Label>
                    <Input
                      value={
                        getEffectiveNavItems().find((it: any) => it.id === "products")?.label ||
                        (entityType === "ADS_SELLER" ? "My Ads" : "Products")
                      }
                      onChange={(e) => handleUpdateNavItem("products", { label: e.target.value })}
                      placeholder={
                        entityType === "ADS_SELLER"
                          ? "e.g. My Ads, Available Cars, Mobile Deals"
                          : "e.g. Products, Apple iPhones, Collection, Store"
                      }
                      className="mt-1 rounded-xl font-bold text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customize this button name to fit your brand (e.g. &quot;Apple iPhones&quot;, &quot;Vehicles&quot;).
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Navigation Action
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateNavItem("products", { type: "scroll" })}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          getEffectiveNavItems().find((it: any) => it.id === "products")?.type !== "page"
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="block font-black">Scroll to Section</span>
                        <span className="text-[10px] text-slate-400 font-normal">Smooth scroll on Home</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentTier === "ONE_PAGE") {
                            setSelectedTierForUpgrade("SIX_PAGES");
                            setUpgradeModalOpen(true);
                          } else {
                            handleUpdateNavItem("products", { type: "page" });
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          getEffectiveNavItems().find((it: any) => it.id === "products")?.type === "page"
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="block font-black">Dedicated Catalog Page</span>
                          {currentTier === "ONE_PAGE" && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {currentTier === "ONE_PAGE" ? "Requires 6-Page plan" : "Opens full catalog with search"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SERVICES SECTION CARD */}
              <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <h4 className="font-bold text-sm">Services Menu Item</h4>
                  </div>
                  <Switch
                    checked={getEffectiveNavItems().find((it: any) => it.id === "services")?.visible !== false}
                    onCheckedChange={(c) => handleUpdateNavItem("services", { visible: c })}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Label</Label>
                    <Input
                      value={getEffectiveNavItems().find((it: any) => it.id === "services")?.label || "Services"}
                      onChange={(e) => handleUpdateNavItem("services", { label: e.target.value })}
                      placeholder="e.g. Services, Salon Packages, Repair Services"
                      className="mt-1 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Click Action</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateNavItem("services", { type: "scroll" })}
                        className={`p-2 rounded-xl border text-xs font-bold text-left transition-all ${
                          getEffectiveNavItems().find((it: any) => it.id === "services")?.type !== "page"
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-white dark:bg-slate-900 text-slate-600"
                        }`}
                      >
                        Scroll to #services
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTier === "ONE_PAGE") {
                            setSelectedTierForUpgrade("SIX_PAGES");
                            setUpgradeModalOpen(true);
                          } else {
                            handleUpdateNavItem("services", { type: "page" });
                          }
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold text-left transition-all ${
                          getEffectiveNavItems().find((it: any) => it.id === "services")?.type === "page"
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-white dark:bg-slate-900 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Dedicated Page</span>
                          {currentTier === "ONE_PAGE" && <Lock className="w-3 h-3 text-amber-500" />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OTHER STANDARD SECTIONS */}
              <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div>
                  <h4 className="font-bold text-sm">Other Standard Sections</h4>
                  <p className="text-[11px] text-slate-400">
                    Switch off to hide button from Navbar. The section will still stay active on your website.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "home", defaultLabel: "Home" },
                    { id: "about", defaultLabel: "About" },
                    { id: "gallery", defaultLabel: "Gallery" },
                    { id: "reviews", defaultLabel: "Reviews" },
                    { id: "contact", defaultLabel: "Contact" },
                  ].map((sec) => {
                    const item = getEffectiveNavItems().find((it: any) => it.id === sec.id) || {
                      id: sec.id,
                      label: sec.defaultLabel,
                      visible: true,
                    };
                    return (
                      <div
                        key={sec.id}
                        className="p-3 border rounded-xl bg-white dark:bg-slate-950 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <Input
                            value={item.label || sec.defaultLabel}
                            onChange={(e) => handleUpdateNavItem(sec.id, { label: e.target.value })}
                            placeholder={sec.defaultLabel}
                            className="h-8 text-xs font-bold rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {item.visible !== false ? "Visible" : "Hidden"}
                          </span>
                          <Switch
                            checked={item.visible !== false}
                            onCheckedChange={(c) => handleUpdateNavItem(sec.id, { visible: c })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM MULTI-PAGES IN NAVBAR & FOOTER */}
              <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Custom Pages in Navbar &amp; Footer</h4>
                    <p className="text-[11px] text-slate-400">
                      Choose whether each created page appears in the Top Navbar and/or Website Footer
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (pages.length >= tierMeta.maxPages) {
                        setUpgradeModalOpen(true);
                      } else {
                        setNewPageModalOpen(true);
                      }
                    }}
                    className="h-7 text-xs font-bold rounded-lg"
                  >
                    <Plus className="w-3 h-3 mr-1" /> New Page
                  </Button>
                </div>

                {pages.length > 0 ? (
                  <div className="space-y-3">
                    {pages.map((p) => {
                      const pageItemId = `custom-page-${p.id}`;
                      const navItem = getEffectiveNavItems().find(
                        (it: any) => it.id === pageItemId || it.target === p.slug
                      );
                      const isVisible = isCustomPageInNavbar(p);
                      const inFooter = isCustomPageInFooter(p);

                      return (
                        <div key={p.id} className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                /{p.slug}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">
                                  Navbar
                                </span>
                                <Switch
                                  checked={isVisible}
                                  onCheckedChange={(c) => handleToggleCustomPageInNav(p, c)}
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">
                                  Footer
                                </span>
                                <Switch
                                  checked={inFooter}
                                  onCheckedChange={(c) => handleToggleCustomPageInFooter(p, c)}
                                />
                              </div>
                            </div>
                          </div>

                          {isVisible && (
                            <div className="pt-1">
                              <Label className="text-[11px] text-slate-500 font-semibold">Navbar Display Label</Label>
                              <Input
                                value={navItem?.label || p.title}
                                onChange={(e) =>
                                  handleUpdateNavItem(navItem?.id || pageItemId, {
                                    label: e.target.value,
                                    target: p.slug,
                                    type: "page",
                                    visible: true,
                                    isCustom: true,
                                  })
                                }
                                className="mt-1 h-8 text-xs font-bold rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 border rounded-xl bg-white dark:bg-slate-950 text-center text-xs text-slate-400">
                    No custom pages created yet. Go to the <strong>Pages</strong> tab to create custom pages like Policy, About Us, or Support!
                  </div>
                )}
              </div>

              {/* Reset to Default Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetNavItems}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Default Navbar</span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB 4: CUSTOM PAGES (DESIGNER & MANAGER) */}
            <TabsContent value="pages" className="space-y-6 pt-4">
              {editingPage ? (
                <div className="space-y-6 pt-2">
                  {/* Top Bar for Designer */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToPageList}
                      className="h-8 px-2 text-xs font-bold gap-1 text-slate-600 hover:text-black rounded-lg"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Pages</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSavePage}
                      disabled={isSavingPage}
                      className="h-8 px-3 rounded-lg text-xs font-black uppercase tracking-wider gap-1.5 text-white shadow-sm"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {isSavingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Page</span>
                    </Button>
                  </div>

                  {/* Page Title & Slug */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Page Identity</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">In Navbar</Label>
                          <Switch
                            checked={isCustomPageInNavbar(editingPage)}
                            onCheckedChange={(val) => handleToggleCustomPageInNav(editingPage, val)}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">In Footer</Label>
                          <Switch
                            checked={isCustomPageInFooter(editingPage)}
                            onCheckedChange={(val) => handleToggleCustomPageInFooter(editingPage, val)}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-slate-600 dark:text-slate-300 font-bold">Published</Label>
                          <Switch
                            checked={editingPage.isPublished !== false}
                            onCheckedChange={(val) => handleUpdateEditingPage({ isPublished: val })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Page Navigation Title</Label>
                      <Input
                        value={editingPage.title || ""}
                        onChange={(e) => handleUpdateEditingPage({ title: e.target.value })}
                        placeholder="e.g. Customer Support"
                        className="mt-1 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">URL Slug</Label>
                      <div className="flex items-center mt-1">
                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-l-xl border border-r-0 font-mono">
                          /
                        </span>
                        <Input
                          value={editingPage.slug || ""}
                          onChange={(e) =>
                            handleUpdateEditingPage({
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            })
                          }
                          placeholder="e.g. support"
                          className="rounded-l-none rounded-r-xl font-mono text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Banner Design */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Hero Banner Styling</h4>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Badge Pill Text</Label>
                      <Input
                        value={editingPage.sectionsJson?.banner?.badge || ""}
                        onChange={(e) =>
                          handleUpdateEditingPage((prev: any) => ({
                            ...prev,
                            sectionsJson: {
                              ...prev.sectionsJson,
                              banner: { ...(prev.sectionsJson?.banner || {}), badge: e.target.value },
                            },
                          }))
                        }
                        placeholder="e.g. HELP & SUPPORT"
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Banner Heading Title</Label>
                      <Input
                        value={editingPage.sectionsJson?.banner?.title || ""}
                        onChange={(e) =>
                          handleUpdateEditingPage((prev: any) => ({
                            ...prev,
                            sectionsJson: {
                              ...prev.sectionsJson,
                              banner: { ...(prev.sectionsJson?.banner || {}), title: e.target.value },
                            },
                          }))
                        }
                        placeholder="e.g. How Can We Help You Today?"
                        className="mt-1 rounded-xl font-bold text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Banner Subtitle</Label>
                      <Textarea
                        rows={2}
                        value={editingPage.sectionsJson?.banner?.subtitle || ""}
                        onChange={(e) =>
                          handleUpdateEditingPage((prev: any) => ({
                            ...prev,
                            sectionsJson: {
                              ...prev.sectionsJson,
                              banner: { ...(prev.sectionsJson?.banner || {}), subtitle: e.target.value },
                            },
                          }))
                        }
                        placeholder="e.g. Reach out to our customer care team via WhatsApp or browse our FAQs."
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">Banner Image (Optional)</Label>
                      <div className="flex items-center gap-3 mt-1.5">
                        {editingPage.sectionsJson?.banner?.bgImage && (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border">
                            <Image
                              src={editingPage.sectionsJson.banner.bgImage}
                              alt="Banner"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50">
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>Upload Banner Image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePageBannerUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Sections on this Custom Page */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                          Dynamic Page Sections ({(editingPage.sectionsJson?.customSections || []).length})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Add interactive Sliders, Videos, Carousels, and Image Banners to this page.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setAddSectionForPage(true);
                          setAddSectionModalOpen(true);
                        }}
                        className="h-7 text-xs font-bold rounded-lg text-white gap-1 shadow-xs"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Section
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {(editingPage.sectionsJson?.customSections || []).map((sec: any, pIdx: number) => (
                        <div key={sec.id || pIdx} id={`custom-section-item-${sec.id}`}>
                          <CustomSectionEditor
                            section={sec}
                            index={pIdx}
                            total={(editingPage.sectionsJson?.customSections || []).length}
                            onUpdate={(updated) => handleUpdateCustomSection(sec.id, updated, true)}
                            onDelete={() => handleRemoveCustomSection(sec.id, true)}
                            onMoveUp={() => handleMovePageCustomSection(pIdx, "up")}
                            onMoveDown={() => handleMovePageCustomSection(pIdx, "down")}
                            canMoveUp={pIdx > 0}
                            canMoveDown={pIdx < (editingPage.sectionsJson?.customSections || []).length - 1}
                          />
                        </div>
                      ))}
                      {(editingPage.sectionsJson?.customSections || []).length === 0 && (
                        <div className="p-6 border border-dashed rounded-xl text-center text-slate-400 bg-white dark:bg-slate-800">
                          <p className="text-xs font-bold">No dynamic sections added to this page yet.</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Click &quot;+ Add Section&quot; to add a Slider, Video, Carousel, or Banner.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Story & Content Description */}
                  <div className="space-y-3 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Page Content & Details</h4>
                    <p className="text-xs text-slate-400">
                      Write detailed information, policy guidelines, about information, or instructions for this page.
                    </p>
                    <Textarea
                      rows={6}
                      value={editingPage.contentHtml || ""}
                      onChange={(e) => handleUpdateEditingPage({ contentHtml: e.target.value })}
                      placeholder="Type your page content here... Supports multiple paragraphs and bullet points."
                      className="rounded-xl text-xs font-medium leading-relaxed"
                    />
                  </div>

                  {/* Feature Highlight Cards */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Feature Highlight Cards</h4>
                        <p className="text-[11px] text-slate-400">Grid of highlight cards with icons.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddFeatureCard}
                        className="h-7 text-[11px] font-bold rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Card
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(editingPage.sectionsJson?.featureCards || []).map((card: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-xl bg-white dark:bg-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Card #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeatureCard(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <Input
                            value={card.title || ""}
                            onChange={(e) => handleUpdateFeatureCard(idx, "title", e.target.value)}
                            placeholder="Card Title (e.g. 24/7 WhatsApp Support)"
                            className="text-xs font-bold rounded-lg h-8"
                          />
                          <Textarea
                            rows={2}
                            value={card.description || ""}
                            onChange={(e) => handleUpdateFeatureCard(idx, "description", e.target.value)}
                            placeholder="Card short description or details..."
                            className="text-xs rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Accordion Section */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">FAQ Questions & Answers</h4>
                        <p className="text-[11px] text-slate-400">Expandable Q&A accordion list.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddFaq}
                        className="h-7 text-[11px] font-bold rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Question
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(editingPage.sectionsJson?.faq || []).map((faqItem: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-xl bg-white dark:bg-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">FAQ #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <Input
                            value={faqItem.question || ""}
                            onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                            placeholder="e.g. How can I contact your support team?"
                            className="text-xs font-bold rounded-lg h-8"
                          />
                          <Textarea
                            rows={2}
                            value={faqItem.answer || ""}
                            onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                            placeholder="Answer text for customers..."
                            className="text-xs rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp CTA */}
                  <div className="space-y-4 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">WhatsApp Call-to-Action</h4>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">CTA Box Heading</Label>
                      <Input
                        value={editingPage.sectionsJson?.cta?.title || ""}
                        onChange={(e) =>
                          handleUpdateEditingPage((prev: any) => ({
                            ...prev,
                            sectionsJson: {
                              ...prev.sectionsJson,
                              cta: { ...(prev.sectionsJson?.cta || {}), title: e.target.value },
                            },
                          }))
                        }
                        placeholder={`e.g. Need Assistance with ${editingPage.title}?`}
                        className="mt-1 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">WhatsApp Button Text</Label>
                      <Input
                        value={editingPage.sectionsJson?.cta?.buttonText || ""}
                        onChange={(e) =>
                          handleUpdateEditingPage((prev: any) => ({
                            ...prev,
                            sectionsJson: {
                              ...prev.sectionsJson,
                              cta: { ...(prev.sectionsJson?.cta || {}), buttonText: e.target.value },
                            },
                          }))
                        }
                        placeholder="e.g. Chat via WhatsApp"
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Google SEO Settings */}
                  <div className="space-y-3 border p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Google SEO Settings</h4>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Meta Title</Label>
                      <Input
                        value={editingPage.metaTitle || ""}
                        onChange={(e) => handleUpdateEditingPage({ metaTitle: e.target.value })}
                        placeholder={`e.g. ${editingPage.title} - ${entityInfo?.businessName}`}
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Meta Description</Label>
                      <Textarea
                        rows={2}
                        value={editingPage.metaDescription || ""}
                        onChange={(e) => handleUpdateEditingPage({ metaDescription: e.target.value })}
                        placeholder="Brief summary for search engine snippet..."
                        className="mt-1 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Bottom Save & Delete Actions */}
                  <div className="pt-2 flex items-center justify-between border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePage(editingPage.id)}
                      className="rounded-xl text-xs font-bold gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Page</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSavePage}
                      disabled={isSavingPage}
                      className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 text-white shadow-lg"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {isSavingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Page Changes</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Custom Pages Manager</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Plan Limit: {pages.length} / {tierMeta.maxPages} pages
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (pages.length >= tierMeta.maxPages) {
                          setUpgradeModalOpen(true);
                        } else {
                          setNewPageModalOpen(true);
                        }
                      }}
                      className="rounded-xl text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Page
                    </Button>
                  </div>

                  {/* Page list */}
                  <div className="space-y-3">
                    <div className="p-3.5 border rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-bold text-sm block">Home Page</span>
                          <span className="text-[11px] text-slate-400">One-page smooth scroll</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        Default
                      </Badge>
                    </div>

                    {pages.map((p) => {
                      const inNav = isCustomPageInNavbar(p);
                      const inFoot = isCustomPageInFooter(p);
                      return (
                        <div
                          key={p.id}
                          className="p-3.5 border rounded-2xl bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm block text-slate-900 dark:text-white truncate">
                                  {p.title}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">/{p.slug}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => handleSelectPageForDesign(p)}
                                className="h-8 px-3 rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 shadow-sm text-white"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                <span>Design Page</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePage(p.id)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 rounded-xl"
                                title="Delete Page"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Quick Navbar & Footer Visibility Toggles */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={inNav}
                                onCheckedChange={(val) => handleToggleCustomPageInNav(p, val)}
                              />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                Show in Navbar
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={inFoot}
                                onCheckedChange={(val) => handleToggleCustomPageInFooter(p, val)}
                              />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                Show in Footer
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Locked Tier Indicator for Pages > Limit */}
                    {currentTier === "ONE_PAGE" && (
                      <div
                        onClick={() => {
                          setSelectedTierForUpgrade("SIX_PAGES");
                          setUpgradeModalOpen(true);
                        }}
                        className="p-4 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100/50 transition-colors flex items-center gap-3.5"
                      >
                        <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-amber-900 dark:text-amber-300">
                            🔒 Multi-Page Option (Locked)
                          </p>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                            Upgrade to 6-Page Plan (Rs. 4,990) to create individual pages like Services, About Us & Gallery.
                          </p>
                        </div>
                      </div>
                    )}

                    {currentTier !== "TWELVE_PAGES" && (
                      <div
                        onClick={() => {
                          setSelectedTierForUpgrade("TWELVE_PAGES");
                          setUpgradeModalOpen(true);
                        }}
                        className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-3.5"
                      >
                        <div className="p-2.5 rounded-xl bg-slate-400 text-white shadow-md">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                            🔒 12-Page Enterprise (Locked)
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Upgrade to 12-Page Plan (Rs. 9,990) to unlock Policy Pages, Return Policy, and unlimited custom content.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 5: STORE, CART, CHECKOUT & INQUIRY SETTINGS */}
            <TabsContent value="checkout" className="space-y-6 pt-4">
              {(() => {
                const ecom = config.footerSection?.ecommerceConfig || {};
                const updateEcom = (updates: Record<string, any>) => {
                  handleUpdateFooterSection({
                    ecommerceConfig: {
                      ...ecom,
                      ...updates,
                    },
                  });
                };

                return (
                  <div className="space-y-5">
                    {/* Plan Mode Overview */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        currentTier === "ONE_PAGE"
                          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200"
                          : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200"
                      } space-y-2`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            Ordering, Cart &amp; Payment Settings
                          </h3>
                        </div>
                        <Badge
                          className={`${
                            currentTier === "ONE_PAGE"
                              ? "bg-amber-500 text-white text-[10px]"
                              : "bg-emerald-600 text-white text-[10px]"
                          } shrink-0 whitespace-nowrap`}
                        >
                          {currentTier === "ONE_PAGE" ? "1-Page Inquiry Mode" : "6/12-Page E-Commerce"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {currentTier === "ONE_PAGE" ? (
                          <>
                            On your <strong>1-Page Website</strong>, customers can order or inquire about products &amp; services directly via <strong>WhatsApp, Email, or the Inquiry Form</strong>. Upgrade to the <strong>6-Page or 12-Page Plan</strong> to unlock Dedicated Product Pages, Shopping Cart, Buy Now &amp; Checkout!
                          </>
                        ) : (
                          <>
                            On your <strong>{tierMeta.name}</strong>, clicking any product, service, or ad opens its <strong>Dedicated Detail Page</strong> with <strong>Add to Cart &amp; Buy Now</strong>, Shopping Cart, and Checkout with <strong>Cash on Delivery (COD)</strong> and <strong>Bank Deposit</strong>!
                          </>
                        )}
                      </p>
                    </div>

                    {/* Ordering Mode Selector */}
                    <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Website Ordering Mode
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => updateEcom({ mode: "auto" })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            !ecom.mode || ecom.mode === "auto"
                              ? "border-primary bg-primary/10 text-primary"
                              : "bg-white dark:bg-slate-900 text-slate-600"
                          }`}
                        >
                          <span className="font-bold text-xs block">
                            Automatic (Recommended)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            1-Page Plan uses WhatsApp/Email/Inquiry; 6 &amp; 12-Page Plans use Full Cart, Buy Now &amp; Checkout.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateEcom({ mode: "inquiry_only" })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            ecom.mode === "inquiry_only"
                              ? "border-primary bg-primary/10 text-primary"
                              : "bg-white dark:bg-slate-900 text-slate-600"
                          }`}
                        >
                          <span className="font-bold text-xs block">
                            Inquiry Mode Only (WhatsApp / Email / Direct Form)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Disable shopping cart and receive all product/service orders via WhatsApp, Email, and Inquiry Form.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (currentTier === "ONE_PAGE") {
                              setSelectedTierForUpgrade("SIX_PAGES");
                              setUpgradeModalOpen(true);
                            } else {
                              updateEcom({ mode: "ecommerce" });
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            ecom.mode === "ecommerce"
                              ? "border-primary bg-primary/10 text-primary"
                              : "bg-white dark:bg-slate-900 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs block">
                              Full E-Commerce Mode (Add to Cart + Buy Now + Checkout)
                            </span>
                            {currentTier === "ONE_PAGE" && (
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Dedicated product/service/ad detail pages, cart drawer, and COD / Bank Deposit checkout.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Methods: COD & Bank Deposit */}
                    <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                          Checkout Payment Methods
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Choose how customers can pay when ordering on your 6/12-page website.
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-950">
                        <div>
                          <p className="font-bold text-xs">Cash on Delivery (COD)</p>
                          <p className="text-[11px] text-slate-400">
                            Customer pays cash when the order is delivered
                          </p>
                        </div>
                        <Switch
                          checked={ecom.enableCod !== false}
                          onCheckedChange={(val) => updateEcom({ enableCod: val })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-950">
                        <div>
                          <p className="font-bold text-xs">Bank Deposit / Online Transfer</p>
                          <p className="text-[11px] text-slate-400">
                            Customer transfers to your bank account &amp; uploads the slip
                          </p>
                        </div>
                        <Switch
                          checked={ecom.enableBankDeposit !== false}
                          onCheckedChange={(val) => updateEcom({ enableBankDeposit: val })}
                        />
                      </div>

                      {/* Bank Account Details */}
                      {ecom.enableBankDeposit !== false && (
                        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-950 space-y-3">
                          <p className="font-bold text-xs text-primary flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Your Bank Account Details (Shown at Checkout)
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div>
                              <Label className="text-[11px] font-bold">Bank Name</Label>
                              <Input
                                value={ecom.bankName || ""}
                                onChange={(e) => updateEcom({ bankName: e.target.value })}
                                placeholder="e.g. Commercial Bank"
                                className="mt-1 h-8 text-xs rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold">Branch</Label>
                              <Input
                                value={ecom.branch || ""}
                                onChange={(e) => updateEcom({ branch: e.target.value })}
                                placeholder="e.g. Colombo 03"
                                className="mt-1 h-8 text-xs rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div>
                              <Label className="text-[11px] font-bold">Account Holder Name</Label>
                              <Input
                                value={ecom.accountName || ""}
                                onChange={(e) => updateEcom({ accountName: e.target.value })}
                                placeholder={entityInfo?.businessName || "Account Name"}
                                className="mt-1 h-8 text-xs rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold">Account Number</Label>
                              <Input
                                value={ecom.accountNumber || ""}
                                onChange={(e) => updateEcom({ accountNumber: e.target.value })}
                                placeholder="e.g. 8001234567"
                                className="mt-1 h-8 text-xs rounded-lg font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Shipping & Delivery Settings */}
                    <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                        Delivery &amp; Shipping Settings
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] font-bold">Standard Delivery Fee (Rs.)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={ecom.shippingFee ?? 350}
                            onChange={(e) => updateEcom({ shippingFee: Number(e.target.value) })}
                            className="mt-1 h-8 text-xs rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-bold">Free Delivery Above (Rs.)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={ecom.freeShippingThreshold ?? 0}
                            onChange={(e) =>
                              updateEcom({ freeShippingThreshold: Number(e.target.value) })
                            }
                            placeholder="0 = disabled"
                            className="mt-1 h-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] font-bold">Estimated Delivery Text</Label>
                        <Input
                          value={ecom.deliveryDays || "2 - 4 Business Days Islandwide"}
                          onChange={(e) => updateEcom({ deliveryDays: e.target.value })}
                          placeholder="e.g. 2 - 4 Business Days Islandwide"
                          className="mt-1 h-8 text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* TAB 6: CUSTOM DOMAIN & VERCEL DNS */}
            <TabsContent value="domain" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Connect Your Own Domain
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Enter your custom domain (e.g. <code>fashiondora.lk</code>) to point visitors directly to your standalone store.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      placeholder="e.g. fashiondora.lk"
                      className="font-medium rounded-xl"
                    />
                    <Button onClick={handleConnectDomain} className="rounded-xl font-bold">
                      Connect
                    </Button>
                  </div>
                </div>

                {customDomain && (
                  <div className="border rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{customDomain.domain}</span>
                      <Badge
                        className={
                          customDomain.dnsStatus === "ACTIVE"
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-white"
                        }
                      >
                        {customDomain.dnsStatus === "ACTIVE" ? "Active & SSL Secured" : "Pending DNS Setup"}
                      </Badge>
                    </div>

                    <div className="space-y-3 text-xs bg-white dark:bg-slate-950 p-3 rounded-xl border">
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        Add these DNS records in your domain provider (e.g. LK Domain Registry, GoDaddy, Namecheap):
                      </p>

                      <div className="space-y-2 font-mono">
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border">
                          <div>
                            <span className="font-bold text-slate-400 mr-2">A Record:</span>
                            <span>@ &rarr; 76.76.21.21</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("76.76.21.21");
                              toast.success("Copied A Record IP!");
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-900" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border">
                          <div>
                            <span className="font-bold text-slate-400 mr-2">CNAME:</span>
                            <span>www &rarr; cname.vercel-dns.com</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("cname.vercel-dns.com");
                              toast.success("Copied CNAME value!");
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-900" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={handleVerifyDomain}
                        disabled={isVerifyingDomain}
                        variant="outline"
                        className="flex-1 rounded-xl text-xs font-bold"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isVerifyingDomain ? "animate-spin" : ""}`} />
                        Check DNS & SSL Status
                      </Button>
                      <Button
                        onClick={handleDisconnectDomain}
                        disabled={isVerifyingDomain}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold gap-1 px-3"
                        title="Disconnect domain from this store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right Live Interactive Preview (On mobile, only visible when Preview button is clicked) ── */}
        <div
          className={`${
            mobilePreviewOpen ? "flex" : "hidden md:flex"
          } flex-1 h-full min-h-0 bg-slate-200/70 dark:bg-slate-950 flex-col items-center justify-center p-2.5 md:p-4 overflow-hidden`}
        >
          {/* Mobile-only Preview Top Bar */}
          <div className="md:hidden w-full flex items-center justify-between gap-2 mb-2 px-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobilePreviewOpen(false)}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-white dark:bg-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Editor</span>
            </Button>

            {pages.length > 0 && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border text-[11px] font-bold overflow-x-auto max-w-[60%]">
                <button
                  type="button"
                  onClick={handleBackToPageList}
                  className={`px-2 py-0.5 rounded-lg transition-all shrink-0 ${
                    !editingPage
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  Home
                </button>
                {pages.map((p) => {
                  const isSelected = editingPage?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPageForDesign(p)}
                      className={`px-2 py-0.5 rounded-lg transition-all truncate max-w-[90px] shrink-0 ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {p.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={`transition-all duration-300 h-full w-full bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
              deviceView === "mobile"
                ? "max-w-[375px] max-h-[820px] rounded-[40px] border-[12px] border-slate-900 shadow-2xl"
                : deviceView === "tablet"
                ? "max-w-[768px] max-h-[920px] rounded-[28px] border-[8px] border-slate-900 shadow-2xl"
                : "max-w-full"
            }`}
          >
            <iframe
              ref={iframeRef}
              src="/site-preview"
              title="Website Preview"
              onLoad={() => sendPreviewUpdate()}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>

      {/* ── Add Custom Section Modal Dialog ── */}
      <Dialog open={addSectionModalOpen} onOpenChange={setAddSectionModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-3xl p-4 sm:p-6 md:p-8 overflow-hidden">
          <DialogHeader className="shrink-0 pb-1">
            <DialogTitle className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>{addSectionForPage ? "Add Dynamic Section to Custom Page" : "Add Dynamic Section to Home Page"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Choose a section type to insert. You can customize images, texts, links, and shift its position anytime with Move Up / Down.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="media" className="w-full pt-1 flex-1 min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-3 w-full rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-3 shrink-0 h-auto">
              <TabsTrigger value="media" className="rounded-lg text-[11px] sm:text-xs font-bold py-2 px-1 text-center truncate">
                <span>🌟 </span>
                <span className="hidden sm:inline">Media &amp; Sliders</span>
                <span className="sm:hidden">Media</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg text-[11px] sm:text-xs font-bold py-2 px-1 text-center truncate">
                <span>📩 </span>
                <span className="hidden sm:inline">Contact Features</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="store" className="rounded-lg text-[11px] sm:text-xs font-bold py-2 px-1 text-center truncate">
                <span>🛍️ </span>
                <span className="hidden sm:inline">Store Sections</span>
                <span className="sm:hidden">Store</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: DYNAMIC MEDIA */}
            <TabsContent value="media" className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 focus-visible:outline-none">
              {/* 1. Slider */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("slider", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-indigo-200/90 hover:border-indigo-600 bg-gradient-to-b from-indigo-50/70 to-white dark:from-indigo-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">Multi-Slide Banner Slider</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Rotating slideshow with photos, headlines, badges, auto-play, and action buttons.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 pt-2 flex items-center gap-1">
                  <span>+ Add Slider</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* 2. Video */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("video", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-rose-200/90 hover:border-rose-600 bg-gradient-to-b from-rose-50/70 to-white dark:from-rose-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Video className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-600">Video Showcase Player</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Responsive player for YouTube, Shorts, Vimeo, or MP4 video links with CTA button.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 pt-2 flex items-center gap-1">
                  <span>+ Add Video</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* 3. Carousel */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("carousel", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200/90 hover:border-amber-600 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600">Feature Carousel Cards</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Horizontal touch-swipeable card carousel with images, tags, prices, and links.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 pt-2 flex items-center gap-1">
                  <span>+ Add Carousel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* 4. Image Banner */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("image_banner", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-teal-200/90 hover:border-teal-600 bg-gradient-to-b from-teal-50/70 to-white dark:from-teal-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600">Promotional Image Banner</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Full-width promo banner with click link, height choices, and headline text overlay.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 pt-2 flex items-center gap-1">
                  <span>+ Add Banner</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </TabsContent>

            {/* TAB 2: CONTACT & LOCATION STANDALONE FEATURES */}
            <TabsContent value="contact" className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 focus-visible:outline-none">
              {/* Form Only */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("contact_form", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-sky-200/90 hover:border-sky-600 bg-gradient-to-b from-sky-50/70 to-white dark:from-sky-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-sky-600">Inquiry &amp; Contact Form Only</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed JUST the inquiry form (Name, Phone, Email, Message, WhatsApp submit) without any other cards.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 pt-2 flex items-center gap-1">
                  <span>+ Add Form Only</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Map Only */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("location_map", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-200/90 hover:border-emerald-600 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">Google Maps Location Only</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed JUST the interactive store map with directions button and address.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 pt-2 flex items-center gap-1">
                  <span>+ Add Map Only</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Cards Only */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("contact_cards", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-violet-200/90 hover:border-violet-600 bg-gradient-to-b from-violet-50/70 to-white dark:from-violet-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-violet-600">Direct Contact Cards Only</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed JUST Phone Call, WhatsApp Chat, Email, and Shop Address info cards.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-violet-600 dark:text-violet-400 pt-2 flex items-center gap-1">
                  <span>+ Add Cards Only</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Hours Only */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("opening_hours", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200/90 hover:border-amber-600 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600">Opening &amp; Working Hours Only</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed JUST the store opening and working hours schedule box.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 pt-2 flex items-center gap-1">
                  <span>+ Add Hours Only</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Full Contact */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("full_contact", addSectionForPage)}
                className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl border-2 border-teal-200/90 hover:border-teal-600 bg-gradient-to-b from-teal-50/70 to-white dark:from-teal-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-teal-600 text-white">Full Section</span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600">Complete Contact &amp; Location Block</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Includes Contact Cards, Opening Hours, Location Map, and the Inquiry Form together.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-600 shrink-0 sm:ml-4 flex items-center gap-1">
                  <span>+ Add Full Contact</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </TabsContent>

            {/* TAB 3: STORE CONTENT SECTIONS */}
            <TabsContent value="store" className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 focus-visible:outline-none">
              {/* Products Catalog */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("products_catalog", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-200/90 hover:border-emerald-600 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">Products &amp; Ads Catalog</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed synced catalog items directly from your store on this page.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 pt-2 flex items-center gap-1">
                  <span>+ Add Products</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Services List */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("services_list", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-blue-200/90 hover:border-blue-600 bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600">Services &amp; Offerings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed your list of featured services and booking details on this page.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 pt-2 flex items-center gap-1">
                  <span>+ Add Services</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* About Story */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("about_story", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-purple-200/90 hover:border-purple-600 bg-gradient-to-b from-purple-50/70 to-white dark:from-purple-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-600">About Our Story</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed your business background story and photo on this page.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 pt-2 flex items-center gap-1">
                  <span>+ Add About Story</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Photo Gallery */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("photo_gallery", addSectionForPage)}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-rose-200/90 hover:border-rose-600 bg-gradient-to-b from-rose-50/70 to-white dark:from-rose-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-600">Photo Gallery Showcase</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Embed your photo gallery grid on this page.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 pt-2 flex items-center gap-1">
                  <span>+ Add Gallery</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Reviews Testimonials */}
              <button
                type="button"
                onClick={() => handleAddCustomSection("reviews_list", addSectionForPage)}
                className="sm:col-span-2 p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200/90 hover:border-amber-600 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900 text-left transition-all hover:shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600">Customer Testimonials &amp; Reviews</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Embed verified customer feedback, star ratings, and review cards.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600 shrink-0 sm:ml-4 flex items-center gap-1">
                  <span>+ Add Reviews</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Plan Upgrade Dialog (PayHere Online + Bank Slip) ── */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              {isSubscriptionExpired ? "Renew or Upgrade Your Website Plan" : "Upgrade Your Website Plan"}
            </DialogTitle>
            <DialogDescription>
              Each subscription is valid for 1 Month (30 Days). Select a plan below to activate, renew, or upgrade your standalone website.
            </DialogDescription>
          </DialogHeader>

          {/* Current Active / Expired Plan Status Card inside Modal */}
          {(activeSubscription || subscriptionLifecycle?.subscription) && (
            <div
              className={`mt-2 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                activeSubscription
                  ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Current Plan:
                  </span>
                  <Badge
                    className={
                      activeSubscription
                        ? "bg-emerald-600 text-white font-bold text-xs"
                        : "bg-rose-600 text-white font-bold text-xs"
                    }
                  >
                    {tierMeta.name} ({activeSubscription ? "ACTIVE" : "EXPIRED"})
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {activeSubscription ? (
                    <>
                      Valid for <strong>1 Month</strong> • Expires on{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {formattedExpiryDate}
                      </strong>{" "}
                      ({subscriptionLifecycle?.daysRemaining ?? 30} days remaining)
                    </>
                  ) : subscriptionLifecycle?.state === "EXPIRED_GRACE_PERIOD" ? (
                    <>
                      Expired on <strong>{formattedExpiryDate}</strong> • Website updates &amp; publishing are locked.{" "}
                      <strong className="text-rose-600">
                        {subscriptionLifecycle.graceDaysRemaining} days left
                      </strong>{" "}
                      before live domain auto-disconnects ({formattedGraceEndDate}).
                    </>
                  ) : (
                    <>
                      Expired on <strong>{formattedExpiryDate}</strong> (14-day grace period ended) • Live domain disconnected &amp; live site offline.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Tier Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            {(["ONE_PAGE", "SIX_PAGES", "TWELVE_PAGES"] as WebsiteTier[]).map((tierKey) => {
              const t = TIER_LIMITS[tierKey];
              const isSelected = selectedTierForUpgrade === tierKey;
              const isCurrentActiveTier = Boolean(activeSubscription && activeSubscription.tier === tierKey);
              const isPreviousExpiredTier = Boolean(
                !activeSubscription &&
                  isSubscriptionExpired &&
                  subscriptionLifecycle?.subscription?.tier === tierKey
              );

              return (
                <div
                  key={tierKey}
                  onClick={() => setSelectedTierForUpgrade(tierKey)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg scale-102"
                      : isCurrentActiveTier
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div>
                    {isCurrentActiveTier && (
                      <div className="mb-2">
                        <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Active Plan
                        </Badge>
                        {formattedExpiryDate && (
                          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                            Expires: {formattedExpiryDate}
                          </p>
                        )}
                      </div>
                    )}

                    {isPreviousExpiredTier && (
                      <div className="mb-2">
                        <Badge variant="destructive" className="text-[10px] uppercase font-extrabold px-2 py-0.5 w-fit">
                          Expired ({formattedExpiryDate})
                        </Badge>
                      </div>
                    )}

                    <h4 className="font-extrabold text-sm">{t.name}</h4>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      Rs. {t.price.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500"> / 1 month</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                    {isSelected ? (
                      <Badge className="bg-primary text-white text-[10px] uppercase font-bold">
                        {isCurrentActiveTier || isPreviousExpiredTier
                          ? "Selected (Renew 1 Month)"
                          : "Selected"}
                      </Badge>
                    ) : isCurrentActiveTier ? (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-700 text-[10px] uppercase font-bold">
                        Current Plan
                      </Badge>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Tabs: PayHere Online vs Bank Transfer */}
          <div className="pt-6 border-t mt-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Choose Payment Method</h4>
            <Tabs defaultValue="online" className="w-full">
              <TabsList className="grid grid-cols-2 w-full p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                <TabsTrigger value="online" className="text-xs font-bold rounded-lg flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Online Payment (Instant)</span>
                </TabsTrigger>
                <TabsTrigger value="bank" className="text-xs font-bold rounded-lg flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank Deposit Slip</span>
                </TabsTrigger>
              </TabsList>

              {/* Online PayHere Tab */}
              <TabsContent value="online" className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-bold">Instant Automated Activation via PayHere</p>
                    <p className="mt-0.5 text-emerald-700/80 dark:text-emerald-400/80">
                      Supports Visa, MasterCard, FriMi, Genie, and Mobile Banking. Your website plan will unlock immediately upon payment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Button
                    onClick={handlePayHereSubmit}
                    disabled={isSubmittingPayment}
                    className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {isSubmittingPayment ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Pay Rs. ${TIER_LIMITS[selectedTierForUpgrade].price.toLocaleString()} via PayHere`
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleInstantActivate}
                    disabled={isSubmittingPayment}
                    className="w-full h-10 rounded-2xl font-bold text-xs border border-dashed border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    ⚡ Instant Activate Plan (One-Click Demo)
                  </Button>
                </div>
              </TabsContent>

              {/* Bank Transfer Slip Tab */}
              <TabsContent value="bank" className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-2xl text-xs space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Bank Transfer Account Details:</p>
                  <p><span className="text-slate-500">Bank:</span> Commercial Bank of Ceylon</p>
                  <p><span className="text-slate-500">Account Name:</span> TryMe Technologies (Pvt) Ltd</p>
                  <p><span className="text-slate-500">Account Number:</span> 8009123456</p>
                  <p><span className="text-slate-500">Branch:</span> Colombo Super Branch</p>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Upload Bank Deposit Slip</Label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:opacity-90 mt-2"
                  />
                </div>

                <Button
                  onClick={handleBankTransferSubmit}
                  disabled={isSubmittingPayment}
                  className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {isSubmittingPayment ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Bank Slip...
                    </span>
                  ) : (
                    "Submit Bank Slip for Approval"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Page Dialog ── */}
      <Dialog open={newPageModalOpen} onOpenChange={setNewPageModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Add New Website Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-slate-500">Page Title</Label>
              <Input
                value={newPageTitle}
                onChange={(e) => {
                  setNewPageTitle(e.target.value);
                  setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
                placeholder="e.g. About Us, Contact Us, Return Policy"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500">URL Slug</Label>
              <Input
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="e.g. return-policy"
                className="mt-1 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Add to Top Navbar
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Show this page link in the top header &amp; mobile menu
                  </span>
                </div>
                <Switch checked={newPageInNavbar} onCheckedChange={setNewPageInNavbar} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Add to Website Footer
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Show this page link in the bottom footer column
                  </span>
                </div>
                <Switch checked={newPageInFooter} onCheckedChange={setNewPageInFooter} />
              </div>
            </div>

            <Button onClick={handleCreatePage} className="w-full rounded-xl font-bold mt-2">
              Create Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
