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
    sitemap: 'https://city-fragrance-medhat-oss-projects.vercel.app/sitemap.xml',
  };
}
