import { cache } from "react";
import { serverApiFetch } from "@/lib/api-client";

/**
 * Resolves standalone store configuration, pages, products, reviews, and domain status
 * by delegating to the dedicated NestJS backend (/api/v1/site/:domainOrSlug).
 */
export async function getStandaloneSiteData(domainOrSlug: string) {
  try {
    const cleanParam = decodeURIComponent(domainOrSlug).toLowerCase().replace(/^www\./, "");
    const res = await serverApiFetch(`/api/v1/site/${encodeURIComponent(cleanParam)}`);
    return res?.data || res || null;
  } catch (error) {
    console.error("[site-resolver] Error resolving standalone site from backend:", error);
    return null;
  }
}

/**
 * Deduplicated, request-scoped cached version of getStandaloneSiteData.
 * In Next.js Server Components, calling this in generateMetadata() and StandaloneSitePage()
 * executes the HTTP request only ONCE per request lifecycle.
 */
export const getStandaloneSiteDataCached = cache(async (domainOrSlug: string) => {
  return getStandaloneSiteData(domainOrSlug);
});
