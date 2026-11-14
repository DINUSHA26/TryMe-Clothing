import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { Lock, AlertTriangle } from "lucide-react";
import { getStandaloneSiteDataCached } from "@/lib/site-resolver";
import StandaloneSiteClient from "./StandaloneSiteClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SitePageProps {
  params: Promise<{ domainOrSlug: string }>;
  searchParams?: Promise<{ page?: string; item?: string }>;
}

export async function generateMetadata({ params, searchParams }: SitePageProps) {
  const { domainOrSlug } = await params;
  const sp = searchParams ? await searchParams : {};
  const activePageSlug = sp?.page || null;
  const activeItemSlug = sp?.item || null;

  const siteData = await getStandaloneSiteDataCached(domainOrSlug);
  if (!siteData) return { title: "Store Not Found" };
  if (siteData.siteOffline) {
    return { title: `${siteData.vendor?.businessName || "Website"} — Currently Offline` };
  }

  const storeName = siteData.vendor?.businessName || "Official Store";
  let title = siteData.config?.metaTitle || `${storeName} | Official Store`;
  let description =
    siteData.config?.metaDescription ||
    (siteData.config?.heroSection as any)?.subtitle ||
    `Discover high quality curated products with premium customer care at ${storeName}. Islandwide delivery available.`;
  let ogImage =
    siteData.config?.ogImage ||
    siteData.vendor?.banner ||
    siteData.vendor?.logo ||
    "/icon.png";

  // If viewing a specific subpage or product item, customize preview metadata
  if (activeItemSlug && Array.isArray(siteData.products)) {
    const matchedProduct = siteData.products.find(
      (p: any) => p.slug === activeItemSlug || p.id === activeItemSlug
    );
    if (matchedProduct) {
      title = `${matchedProduct.title} | ${storeName}`;
      if (matchedProduct.description) {
        description = matchedProduct.description.slice(0, 160);
      }
      if (matchedProduct.image) {
        ogImage = matchedProduct.image;
      }
    }
  } else if (activePageSlug && Array.isArray(siteData.config?.pages)) {
    const matchedPage = siteData.config.pages.find((p: any) => p.slug === activePageSlug);
    if (matchedPage) {
      title = matchedPage.metaTitle || `${matchedPage.title} | ${storeName}`;
      if (matchedPage.metaDescription) {
        description = matchedPage.metaDescription;
      }
    }
  }

  const faviconUrl =
    (siteData.config?.heroSection as any)?.faviconUrl ||
    siteData.vendor?.logo ||
    "/icon.png";

  // Canonical Domain Resolution
  const domain =
    siteData.customDomain?.domain ||
    (domainOrSlug.includes(".") ? domainOrSlug : `${domainOrSlug}.tryme.lk`);
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const canonicalUrl = `https://${cleanDomain}`;

  // Footer SEO & Meta Verification config
  const footerConfig = (siteData.config?.footerSection as any) || {};
  const seoConfig = footerConfig.seoConfig || {};
  const metaVerificationCode =
    seoConfig.metaVerificationCode ||
    footerConfig.metaVerificationCode ||
    siteData.customDomain?.verificationKey;
  const fbAppId = seoConfig.facebookAppId || footerConfig.facebookAppId;

  return {
    metadataBase: new URL(canonicalUrl),
    title,
    description,
    applicationName: storeName,
    alternates: {
      canonical: `${canonicalUrl}/`,
    },
    icons: {
      icon: [
        { url: faviconUrl },
        { url: faviconUrl, sizes: "32x32" },
        { url: faviconUrl, sizes: "16x16" },
      ],
      shortcut: [faviconUrl],
      apple: [{ url: faviconUrl }],
    },
    openGraph: {
      title,
      description,
      url: `${canonicalUrl}/`,
      siteName: storeName,
      type: "website",
      locale: "en_US",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    other: {
      "og:type": "website",
      "og:url": `${canonicalUrl}/`,
      ...(metaVerificationCode ? { "facebook-domain-verification": metaVerificationCode } : {}),
      ...(fbAppId ? { "fb:app_id": fbAppId } : {}),
    },
  };
}

export default async function StandaloneSitePage({ params, searchParams }: SitePageProps) {
  const { domainOrSlug } = await params;
  const searchParamsObj = searchParams ? await searchParams : {};
  const activePageSlug = searchParamsObj?.page || null;
  const activeItemSlug = searchParamsObj?.item || null;

  const siteData = await getStandaloneSiteDataCached(domainOrSlug);

  if (!siteData) {
    notFound();
  }

  // If subscription expired and 14-day grace period has elapsed:
  // Live custom domain is disconnected and live website access is disabled.
  if (siteData.siteOffline) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" /> Website Offline
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              {siteData.vendor?.businessName || "Store"} is Currently Unavailable
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This standalone website&apos;s subscription has expired and the 14-day renewal grace period has ended. Live domain access has been suspended.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800 text-xs text-slate-500 space-y-3">
            <p>Are you the store owner? Renew or upgrade your website plan to restore live access.</p>
            <Link
              href="/vendor/website-builder"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
            >
              Go to Website Builder to Renew Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const storeName = siteData.vendor?.businessName || "Official Store";
  const faviconUrl =
    (siteData.config?.heroSection as any)?.faviconUrl ||
    siteData.vendor?.logo ||
    "/icon.png";

  const domain =
    siteData.customDomain?.domain ||
    (domainOrSlug.includes(".") ? domainOrSlug : `${domainOrSlug}.tryme.lk`);
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const canonicalUrl = `https://${cleanDomain}`;

  const footerConfig = (siteData.config?.footerSection as any) || {};
  const seoConfig = footerConfig.seoConfig || {};
  const metaVerificationCode =
    seoConfig.metaVerificationCode ||
    footerConfig.metaVerificationCode ||
    siteData.customDomain?.verificationKey;
  const fbPixelId = siteData.config?.facebookPixelId || seoConfig.facebookPixelId;
  const gaId = siteData.config?.googleAnalyticsId || seoConfig.googleAnalyticsId;

  // Structured Data Schema (JSON-LD) for Search Engines & Meta Scrapers
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: `${canonicalUrl}/`,
    description:
      siteData.config?.metaDescription ||
      (siteData.config?.heroSection as any)?.subtitle ||
      `Official store of ${storeName}`,
    publisher: {
      "@type": "Organization",
      name: storeName,
      logo: {
        "@type": "ImageObject",
        url: faviconUrl,
      },
    },
  };

  return (
    <>
      <link rel="icon" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={faviconUrl} />
      <link rel="canonical" href={`${canonicalUrl}/`} />

      {/* Meta verification tag in head for crawlers */}
      {metaVerificationCode && (
        <meta name="facebook-domain-verification" content={metaVerificationCode} />
      )}

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Meta Pixel (Facebook Pixel) Script */}
      {fbPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Google Analytics 4 Script */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-standalone"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `,
            }}
          />
        </>
      )}

      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <StandaloneSiteClient
          domainOrSlug={domainOrSlug}
          siteData={siteData}
          initialPageSlug={activePageSlug}
          initialItemSlug={activeItemSlug}
        />
      </Suspense>
    </>
  );
}
