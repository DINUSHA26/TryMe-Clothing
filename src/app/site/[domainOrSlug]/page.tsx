import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Lock, AlertTriangle } from "lucide-react";
import { getStandaloneSiteData } from "@/lib/site-resolver";
import StandaloneSiteClient from "./StandaloneSiteClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SitePageProps {
  params: Promise<{ domainOrSlug: string }>;
  searchParams?: Promise<{ page?: string; item?: string }>;
}

export async function generateMetadata({ params }: SitePageProps) {
  const { domainOrSlug } = await params;
  const siteData = await getStandaloneSiteData(domainOrSlug);
  if (!siteData) return { title: "Store Not Found" };
  if (siteData.siteOffline) {
    return { title: `${siteData.vendor?.businessName || "Website"} — Currently Offline` };
  }
  const storeName = siteData.vendor?.businessName || "Store";
  const title = siteData.config?.metaTitle || `${storeName} | Official Store`;
  const description =
    siteData.config?.metaDescription ||
    (siteData.config?.heroSection as any)?.subtitle ||
    `Welcome to ${storeName}`;
  const ogImage = siteData.config?.ogImage || siteData.vendor?.banner || siteData.vendor?.logo;

  const faviconUrl =
    (siteData.config?.heroSection as any)?.faviconUrl ||
    siteData.vendor?.logo ||
    "/icon.png";

  return {
    title,
    description,
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
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function StandaloneSitePage({ params, searchParams }: SitePageProps) {
  const { domainOrSlug } = await params;
  const searchParamsObj = searchParams ? await searchParams : {};
  const activePageSlug = searchParamsObj?.page || null;
  const activeItemSlug = searchParamsObj?.item || null;

  const siteData = await getStandaloneSiteData(domainOrSlug);

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

  const faviconUrl =
    (siteData.config?.heroSection as any)?.faviconUrl ||
    siteData.vendor?.logo ||
    "/icon.png";

  return (
    <>
      <link rel="icon" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={faviconUrl} />
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
