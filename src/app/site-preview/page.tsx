"use client";

import { useEffect, useState, Suspense } from "react";
import StandaloneSiteClient from "../site/[domainOrSlug]/StandaloneSiteClient";

function SitePreviewContent() {
  const [hasReceivedData, setHasReceivedData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rawPayload, setRawPayload] = useState<any>({
    config: {
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
      productsSection: {
        enabled: true,
        title: "Store Products",
        subtitle: "",
        badge: "STORE INVENTORY",
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
    },
    entityInfo: {
      businessName: "My Store",
      slug: "preview-store",
      logo: null,
    },
    pages: [],
    products: [],
    entityType: "VENDOR",
    activeSubscription: null,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PREVIEW_UPDATE" && event.data?.payload) {
        setRawPayload(event.data.payload);
        setHasReceivedData(true);
        if (event.data.deviceView) {
          setPreviewDevice(event.data.deviceView);
        }
        if (event.data.activePageSlug) {
          setActiveTab(event.data.activePageSlug);
        }
      } else if (event.data?.type === "PREVIEW_SET_PAGE") {
        if (event.data.pageSlug) {
          setActiveTab(event.data.pageSlug);
        }
        if (event.data.page) {
          setRawPayload((prev: any) => {
            const existingPages = prev.pages || [];
            const idx = existingPages.findIndex(
              (p: any) => p.id === event.data.page.id || p.slug === event.data.page.slug
            );
            if (idx >= 0) {
              const updated = [...existingPages];
              updated[idx] = { ...updated[idx], ...event.data.page };
              return { ...prev, pages: updated };
            } else {
              return { ...prev, pages: [...existingPages, event.data.page] };
            }
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    try {
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    } catch {}

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!hasReceivedData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Live Preview...
        </p>
      </div>
    );
  }

  const configuredMode = rawPayload.config?.footerSection?.ecommerceConfig?.websiteMode;
  const effectiveTier =
    configuredMode === "ONE_PAGE"
      ? "ONE_PAGE"
      : configuredMode === "MULTI_PAGE"
      ? "SIX_PAGES"
      : rawPayload.activeTier ||
        rawPayload.activeSubscription?.tier ||
        (rawPayload.pages && rawPayload.pages.length > 0 ? "SIX_PAGES" : "ONE_PAGE");

  const mappedSiteData = {
    type: rawPayload.entityType || "VENDOR",
    tier: effectiveTier,
    vendor: {
      id: rawPayload.entityInfo?.id || "preview",
      businessName: rawPayload.entityInfo?.businessName || "My Store",
      slug: rawPayload.entityInfo?.slug || "preview-store",
      logo: rawPayload.entityInfo?.logo || null,
      banner: rawPayload.entityInfo?.banner || null,
      phone: rawPayload.config?.contactSection?.phone || rawPayload.entityInfo?.phone || "",
      email: rawPayload.config?.contactSection?.email || "",
      address: rawPayload.config?.contactSection?.address || "",
    },
    config: {
      ...rawPayload.config,
      pages: rawPayload.pages || [],
    },
    subscription: rawPayload.activeSubscription || null,
    products: rawPayload.products || [],
    websiteReviews: rawPayload.config?.reviewsSection?.websiteReviews || [],
  };

  return (
    <div className="w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth">
      <StandaloneSiteClient
        domainOrSlug={rawPayload.entityInfo?.slug || "preview-store"}
        siteData={mappedSiteData}
        initialPageSlug={activeTab}
        isPreview={true}
        previewDevice={previewDevice}
        onPreviewPageSelect={(slug) => {
          setActiveTab(slug);
          try {
            window.parent.postMessage({ type: "PAGE_SELECTED_IN_PREVIEW", pageSlug: slug }, "*");
          } catch {}
        }}
      />
    </div>
  );
}

export default function SitePreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SitePreviewContent />
    </Suspense>
  );
}
