import { MetadataRoute } from 'next';
import { getAppUrl } from '../lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/marketplace',
        '/new-arrivals',
        '/deals',
        '/products/',
        '/categories/',
        '/vendors/',
        '/contact',
        '/help',
        '/privacy',
        '/terms',
        '/shipping',
        '/returns',
      ],
      disallow: [
        '/admin/',
        '/vendor/',
        '/ads-seller/',
        '/api/',
        '/cart/',
        '/checkout/',
        '/profile/',
        '/orders/',
        '/wishlist/',
        '/notifications/',
        '/my-disputes/',
        '/followed-stores/',
        '/payment/',
        '/403/',
        '/*?*', // Block internal search query parameters or filter parameters from being crawled to avoid duplicate content SEO issues
      ],
    },
    sitemap: `${baseUrl}/sitemap-primewear.xml`,
  };
}
