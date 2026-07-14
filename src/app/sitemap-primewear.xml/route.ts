import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getAppUrl } from '../../lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = getAppUrl();

  try {
    // 1. Fetch active categories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // 2. Fetch active and non-disabled products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isDisabledByAdmin: false,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // 3. Fetch active vendor shops
    const vendors = await prisma.vendor.findMany({
      where: {
        status: 'ACTIVE',
        isShopOpen: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // 4. Core static pages with SEO priorities
    const staticPages = [
      { url: '', changefreq: 'daily', priority: 1.0 },
      { url: '/marketplace', changefreq: 'daily', priority: 0.9 },
      { url: '/new-arrivals', changefreq: 'daily', priority: 0.8 },
      { url: '/deals', changefreq: 'daily', priority: 0.8 },
      { url: '/contact', changefreq: 'weekly', priority: 0.6 },
      { url: '/help', changefreq: 'weekly', priority: 0.6 },
      { url: '/privacy', changefreq: 'monthly', priority: 0.3 },
      { url: '/terms', changefreq: 'monthly', priority: 0.3 },
      { url: '/shipping', changefreq: 'monthly', priority: 0.3 },
      { url: '/returns', changefreq: 'monthly', priority: 0.3 },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add categories (high priority for storefront browsing)
    for (const category of categories) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/categories/${category.slug}</loc>\n`;
      xml += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Add products (medium-high priority, daily updates if prices/stocks change)
    for (const product of products) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Add active vendor storefronts (medium-low priority)
    for (const vendor of vendors) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/vendors/${vendor.slug}</loc>\n`;
      xml += `    <lastmod>${vendor.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=18000',
      },
    });
  } catch (error) {
    console.error('Failed to generate dynamic sitemap:', error);
    
    // Graceful fallback with static pages if database connection fails
    const staticPages = [
      { url: '', changefreq: 'daily', priority: 1.0 },
      { url: '/marketplace', changefreq: 'daily', priority: 0.9 },
      { url: '/new-arrivals', changefreq: 'daily', priority: 0.8 },
      { url: '/deals', changefreq: 'daily', priority: 0.8 },
      { url: '/contact', changefreq: 'weekly', priority: 0.6 },
      { url: '/help', changefreq: 'weekly', priority: 0.6 },
      { url: '/privacy', changefreq: 'monthly', priority: 0.3 },
      { url: '/terms', changefreq: 'monthly', priority: 0.3 },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    }
    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=600',
      },
    });
  }
}
