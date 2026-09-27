import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/api/',
          '/api/*',
          '/cashier/',
          '/cashier/*',
        ],
      },
    ],
    sitemap: 'https://city-fragrance.malk35t-754.workers.dev/sitemap.xml',
  };
}
