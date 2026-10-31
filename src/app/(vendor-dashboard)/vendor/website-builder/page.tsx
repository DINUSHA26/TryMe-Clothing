"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Globe,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
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
  ShoppingBag,
  Menu,
  Sliders,
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
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";

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
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [isSavingPage, setIsSavingPage] = useState(false);

  // New Page Dialog
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const autoSaveTimeoutRef = useRef<any>(null);
  const autoSaveConfig = (cfgToSave: any) => {
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
    if (Array.isArray(config.navItemsJson) && config.navItemsJson.length > 0) {
      return config.navItemsJson;
    }
    return [
      { id: "home", label: "Home", type: "scroll", target: "home", visible: true },
      {
        id: "services",
        label: "Services",
        type: "scroll",
        target: "services",
        visible: config.servicesSection?.enabled !== false,
      },
      {
        id: "products",
        label: entityType === "ADS_SELLER" ? "My Ads" : "Products",
        type: "scroll",
        target: "products",
        visible: config.productsSection?.enabled !== false,
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
      const nextConfig = { ...prev, navItemsJson: updatedList };
      if (id === "gallery" && typeof updates.visible === "boolean") {
        nextConfig.gallerySection = {
          ...(prev.gallerySection || {}),
          enabled: updates.visible,
        };
      }
      if (id === "reviews" && typeof updates.visible === "boolean") {
        nextConfig.reviewsSection = {
          ...(prev.reviewsSection || {}),
          enabled: updates.visible,
        };
      }
      if (id === "about" && typeof updates.visible === "boolean") {
        nextConfig.aboutSection = {
          ...(prev.aboutSection || {}),
          enabled: updates.visible,
        };
      }
      if (id === "services" && typeof updates.visible === "boolean") {
        nextConfig.servicesSection = {
          ...(prev.servicesSection || {}),
          enabled: updates.visible,
        };
      }
      if (id === "products" && typeof updates.visible === "boolean") {
        nextConfig.productsSection = {
          ...(prev.productsSection || {}),
          enabled: updates.visible,
        };
      }
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
      updatedList[idx] = { ...updatedList[idx], visible };
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
    setConfig((prev: any) => {
      const nextConfig = { ...prev, navItemsJson: updatedList };
      autoSaveConfig(nextConfig);
      return nextConfig;
    });
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
  const sendPreviewUpdate = () => {
    if (loading) return;
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PREVIEW_UPDATE",
          activePageSlug: editingPage?.slug || "home",
          payload: {
            config,
            entityInfo,
            pages,
            products,
            entityType,
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
  }, [config, entityInfo, pages, editingPage, loading]);

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
        if (json.data.activeSubscription) {
          setActiveSubscription(json.data.activeSubscription);
        }
        if (json.data.customDomain) {
          setCustomDomain(json.data.customDomain);
          setNewDomainInput(json.data.customDomain.domain);
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
        toast.success(publish ? "Website published successfully!" : "Draft changes saved!");
      } else {
        toast.error(data.error || "Failed to save changes");
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
      const res = await fetch("/api/vendor/website/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPageTitle, slug: newPageSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setPages((prev) => [...prev, data.data]);
        setNewPageModalOpen(false);
        setNewPageTitle("");
        setNewPageSlug("");
        toast.success("Page created! You can now design its content.");
        handleSelectPageForDesign(data.data);
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
      sectionsJson: page.sectionsJson || {
        banner: { title: page.title, subtitle: "", badge: "", bgImage: "" },
        featureCards: [],
        faq: [],
        cta: { title: `Have questions about ${page.title}?`, buttonText: "Chat on WhatsApp" },
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

  const handlePageBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPage) return;
    toast.loading("Uploading banner image...", { id: "upload-page-banner" });
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
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

  const currentTier: WebsiteTier = activeSubscription?.tier || "ONE_PAGE";
  const tierMeta = TIER_LIMITS[currentTier];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* ── Builder Top Toolbar ── */}
      <header className="h-16 border-b bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="font-black text-lg tracking-tight">WEBSITE BUILDER</h1>
          </div>

          {/* Active Plan Badge */}
          <div className="flex items-center gap-2 pl-4 border-l">
            {activeSubscription ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-3 py-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{tierMeta.name} (Active)</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 font-bold px-3 py-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Free Trial Mode</span>
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setUpgradeModalOpen(true)}
              className="text-xs font-black uppercase tracking-wider rounded-lg border-primary text-primary hover:bg-primary hover:text-white"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Device Switcher & Action Buttons */}
        <div className="flex items-center gap-3">
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

          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
            disabled={saving}
            className="font-bold text-xs rounded-xl"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Draft
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Publish
          </Button>
        </div>
      </header>

      {/* ── Main Split View ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Editor Sidebar ── */}
        <div className="w-full lg:w-[480px] border-r bg-white dark:bg-slate-900 overflow-y-auto p-6 space-y-6">
          <Tabs value={builderTab} onValueChange={setBuilderTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger value="branding" className="text-xs font-bold rounded-lg">Branding</TabsTrigger>
              <TabsTrigger value="sections" className="text-xs font-bold rounded-lg">Sections</TabsTrigger>
              <TabsTrigger value="menu" className="text-xs font-bold rounded-lg">Navbar</TabsTrigger>
              <TabsTrigger value="pages" className="text-xs font-bold rounded-lg">Pages</TabsTrigger>
              <TabsTrigger value="domain" className="text-xs font-bold rounded-lg">Domain</TabsTrigger>
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
                        Browser tab bar eke penwana icon eka (Default: Store Logo)
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

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Header Button CTA Text</Label>
                  <Input
                    value={config.headerSection?.buttonText || "Book via WhatsApp"}
                    onChange={(e) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        headerSection: { ...(prev.headerSection || {}), buttonText: e.target.value },
                      }))
                    }
                    className="mt-1 font-semibold rounded-xl"
                  />
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

            {/* TAB 2: SECTIONS BUILDER */}
            <TabsContent value="sections" className="space-y-6 pt-4">
              {/* HERO SECTION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Hero Banner</h3>
                  </div>
                  <Switch
                    checked={config.heroSection?.enabled !== false}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        heroSection: { ...prev.heroSection, enabled: c },
                      }))
                    }
                  />
                </div>

                {config.heroSection?.enabled !== false && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Headline</Label>
                      <Input
                        value={config.heroSection?.title || ""}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            heroSection: { ...prev.heroSection, title: e.target.value },
                          }))
                        }
                        className="rounded-xl mt-1 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Subtitle Description</Label>
                      <Textarea
                        rows={2}
                        value={config.heroSection?.subtitle || ""}
                        onChange={(e) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            heroSection: { ...prev.heroSection, subtitle: e.target.value },
                          }))
                        }
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 font-semibold">Hero Photo</Label>
                      <div className="mt-1.5 flex items-center gap-3">
                        {config.heroSection?.bgImage && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border">
                            <Image src={config.heroSection.bgImage} alt="Hero" fill className="object-cover" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm">
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "heroImage")} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PRODUCTS & MY ADS SHOWCASE (⚡ LIVE SYNCED WITH TRYME) */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm">Products & Ads (Live Synced)</h3>
                  </div>
                  <Switch
                    checked={config.productsSection?.enabled !== false}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        productsSection: { ...(prev.productsSection || {}), enabled: c },
                      }))
                    }
                  />
                </div>

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
                  <div className="space-y-3 pt-1">
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
                  </div>
                )}
              </div>

              {/* SERVICES SECTION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Services & Offerings</h3>
                  </div>
                  <Switch
                    checked={config.servicesSection?.enabled !== false}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        servicesSection: { ...prev.servicesSection, enabled: c },
                      }))
                    }
                  />
                </div>

                {config.servicesSection?.enabled !== false && (
                  <div className="space-y-3 pt-2">
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

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700">Custom Service Cards</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentItems = config.servicesSection?.items || [];
                            setConfig((prev: any) => ({
                              ...prev,
                              servicesSection: {
                                ...(prev.servicesSection || {}),
                                items: [...currentItems, { name: "New Service", price: "Rs. 2,500", description: "", imageUrl: "" }],
                              },
                            }));
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg px-2"
                        >
                          + Add Service
                        </Button>
                      </div>

                      {(config.servicesSection?.items || []).map((srv: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border space-y-2">
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
                          <Input
                            placeholder="Short description"
                            value={srv.description || ""}
                            onChange={(e) => {
                              const items = [...(config.servicesSection?.items || [])];
                              items[idx] = { ...items[idx], description: e.target.value };
                              setConfig((prev: any) => ({ ...prev, servicesSection: { ...prev.servicesSection, items } }));
                            }}
                            className="text-xs h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ABOUT SECTION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">About Section</h3>
                  </div>
                  <Switch
                    checked={config.aboutSection?.enabled !== false}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        aboutSection: { ...(prev.aboutSection || {}), enabled: c },
                      }))
                    }
                  />
                </div>

                {config.aboutSection?.enabled !== false && (
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
                  </div>
                )}
              </div>

              {/* GALLERY SECTION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Gallery Showcase</h3>
                  </div>
                  <Switch
                    checked={Boolean(config.gallerySection?.enabled)}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        gallerySection: { ...(prev.gallerySection || {}), enabled: c },
                      }))
                    }
                  />
                </div>

                {Boolean(config.gallerySection?.enabled) && (
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
                  </div>
                )}
              </div>

              {/* REVIEWS & TESTIMONIALS */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="font-bold text-sm">Customer Reviews / Testimonials</h3>
                  </div>
                  <Switch
                    checked={Boolean(config.reviewsSection?.enabled)}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        reviewsSection: { ...(prev.reviewsSection || {}), enabled: c },
                      }))
                    }
                  />
                </div>

                {Boolean(config.reviewsSection?.enabled) && (
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
                  </div>
                )}
              </div>

              {/* CONTACT US & LOCATION SECTION */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Contact Us &amp; Location</h3>
                  </div>
                  <Switch
                    checked={config.contactSection?.enabled !== false}
                    onCheckedChange={(c) => handleUpdateContactSection({ enabled: c })}
                  />
                </div>

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
                </div>
              </div>

              {/* RICH CUSTOMIZABLE FOOTER */}
              <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">Footer &amp; Navigation Columns</h3>
                  </div>
                  <Switch
                    checked={config.footerSection?.enabled !== false}
                    onCheckedChange={(c) =>
                      setConfig((prev: any) => ({
                        ...prev,
                        footerSection: { ...(prev.footerSection || {}), enabled: c },
                      }))
                    }
                  />
                </div>

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

                    <div className="flex items-center justify-between pt-1 border-t">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                          Custom Pages &amp; Policies Links
                        </span>
                        <span className="text-[10px] text-slate-400">Show created pages (Privacy, Terms, FAQ, etc.)</span>
                      </div>
                      <Switch
                        checked={config.footerSection?.showPagesLinks !== false}
                        onCheckedChange={(c) =>
                          setConfig((prev: any) => ({
                            ...prev,
                            footerSection: { ...(prev.footerSection || {}), showPagesLinks: c },
                          }))
                        }
                      />
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
                  </div>
                </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Menu className="w-4 h-4 text-primary" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Navbar &amp; Menu Customizer
                    </h3>
                  </div>
                  <Badge
                    className={
                      currentTier === "ONE_PAGE"
                        ? "bg-amber-500 text-white font-bold text-[10px]"
                        : "bg-emerald-600 text-white font-bold text-[10px]"
                    }
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
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
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
                <h4 className="font-bold text-sm">Other Standard Sections</h4>
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

              {/* CUSTOM MULTI-PAGES IN NAVBAR */}
              <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Custom Pages in Navbar</h4>
                    <p className="text-[11px] text-slate-400">
                      Toggle whether your created pages appear in the top header
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
                      const isVisible = navItem ? navItem.visible !== false : false;

                      return (
                        <div key={p.id} className="p-3 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                /{p.slug}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                {isVisible ? "In Menu" : "Excluded"}
                              </span>
                              <Switch
                                checked={isVisible}
                                onCheckedChange={(c) => handleToggleCustomPageInNav(p, c)}
                              />
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
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Page Identity</h4>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-500 font-semibold">Published</Label>
                        <Switch
                          checked={editingPage.isPublished !== false}
                          onCheckedChange={(val) => handleUpdateEditingPage({ isPublished: val })}
                        />
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

                    {pages.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 border rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block text-slate-900 dark:text-white">{p.title}</span>
                            <span className="text-xs text-slate-400 font-mono">/{p.slug}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectPageForDesign(p)}
                            className="h-8 px-3 rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 shadow-sm text-white"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
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
                    ))}

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

            {/* TAB 4: CUSTOM DOMAIN & VERCEL DNS */}
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

        {/* ── Right Live Interactive Preview ── */}
        <div className="flex-1 bg-slate-200/70 dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
          <div
            className={`transition-all duration-300 h-full w-full bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
              deviceView === "mobile"
                ? "max-w-[375px] max-h-[780px] rounded-[40px] border-[12px] border-slate-900 shadow-2xl"
                : deviceView === "tablet"
                ? "max-w-[768px] max-h-[920px] rounded-[28px] border-[8px] border-slate-900 shadow-2xl"
                : "max-w-full"
            }`}
          >
            <iframe
              ref={iframeRef}
              src="/site-preview"
              title="Website Preview"
              onLoad={sendPreviewUpdate}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>

      {/* ── Plan Upgrade Dialog (PayHere Online + Bank Slip) ── */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Upgrade Your Website Plan
            </DialogTitle>
            <DialogDescription>
              Select a plan to unlock advanced multi-page builder, custom domain mapping, and white-label storefronts.
            </DialogDescription>
          </DialogHeader>

          {/* Tier Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {(["ONE_PAGE", "SIX_PAGES", "TWELVE_PAGES"] as WebsiteTier[]).map((tierKey) => {
              const t = TIER_LIMITS[tierKey];
              const isSelected = selectedTierForUpgrade === tierKey;

              return (
                <div
                  key={tierKey}
                  onClick={() => setSelectedTierForUpgrade(tierKey)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg scale-102"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-sm">{t.name}</h4>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      Rs. {t.price.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.description}</p>
                  </div>
                  {isSelected && (
                    <Badge className="mt-4 bg-primary text-white text-[10px] uppercase font-bold self-start">
                      Selected
                    </Badge>
                  )}
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
                placeholder="e.g. Return Policy"
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
            <Button onClick={handleCreatePage} className="w-full rounded-xl font-bold mt-2">
              Create Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
