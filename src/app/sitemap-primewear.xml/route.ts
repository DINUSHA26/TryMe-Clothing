import { NextResponse } from 'next/server';
import { getAppUrl } from '../../lib/env';
import { serverApiFetch } from '../../lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = getAppUrl();

  try {
    // 1. Fetch active categories from NestJS
    const categoriesRes = await serverApiFetch('/api/v1/storefront/categories').catch(() => []);
    const categories: any[] = Array.isArray(categoriesRes)
      ? categoriesRes
      : categoriesRes?.data || [];

    // 2. Fetch active products from NestJS
    const productsRes = await serverApiFetch('/api/v1/storefront/products?limit=500').catch(() => ({}));
    const products: any[] = Array.isArray(productsRes?.products)
      ? productsRes.products
      : Array.isArray(productsRes)
      ? productsRes
      : [];

    // 3. Fetch active vendors from NestJS
    const vendorsRes = await serverApiFetch('/api/v1/vendors').catch(() => []);
    const vendors: any[] = Array.isArray(vendorsRes)
      ? vendorsRes
      : vendorsRes?.data || [];

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

    // Add categories
    for (const category of categories) {
      if (!category?.slug) continue;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/categories/${category.slug}</loc>\n`;
      if (category.updatedAt) {
        xml += `    <lastmod>${new Date(category.updatedAt).toISOString()}</lastmod>\n`;
      }
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Add products
    for (const product of products) {
      if (!product?.slug) continue;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
      if (product.updatedAt) {
        xml += `    <lastmod>${new Date(product.updatedAt).toISOString()}</lastmod>\n`;
      }
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Add active vendor storefronts
    for (const vendor of vendors) {
      if (!vendor?.slug) continue;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/vendors/${vendor.slug}</loc>\n`;
      if (vendor.updatedAt) {
        xml += `    <lastmod>${new Date(vendor.updatedAt).toISOString()}</lastmod>\n`;
      }
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
    
    // Graceful fallback with static pages if backend fails
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
