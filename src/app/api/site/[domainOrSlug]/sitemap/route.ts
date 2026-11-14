import { NextRequest, NextResponse } from "next/server";
import { getStandaloneSiteDataCached } from "@/lib/site-resolver";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteDataCached(domainOrSlug);

    const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || domainOrSlug;
    const host = rawHost.toLowerCase().replace(/:\d+$/, "");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;

    const today = new Date().toISOString().split("T")[0];

    const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
      {
        loc: `${baseUrl}/`,
        lastmod: today,
        changefreq: "daily",
        priority: "1.0",
      },
    ];

    if (siteData && !siteData.siteOffline) {
      // Add custom pages
      if (Array.isArray(siteData.config?.pages)) {
        for (const page of siteData.config.pages) {
          if (page.isPublished && page.slug) {
            urls.push({
              loc: `${baseUrl}/?page=${encodeURIComponent(page.slug)}`,
              lastmod: today,
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        }
      }

      // Add products / catalog items
      if (Array.isArray(siteData.products)) {
        for (const product of siteData.products) {
          if (product.slug) {
            urls.push({
              loc: `${baseUrl}/?page=product&item=${encodeURIComponent(product.slug)}`,
              lastmod: today,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    console.error("Custom domain sitemap generation error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}

