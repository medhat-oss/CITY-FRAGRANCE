import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://city-fragrance-medhat-oss-projects.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/collections/gift-sets`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Dynamic product routes ────────────────────────────────────────────────
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isDraft: false },
      select: { id: true, updatedAt: true, images: true },
    });

    productRoutes = products.map((product) => {
      const rawImages = product.images;
      const imageList: string[] = Array.isArray(rawImages)
        ? (rawImages as unknown[]).filter((v): v is string => typeof v === 'string')
        : [];

      return {
        url: `${BASE_URL}/product/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        ...(imageList.length > 0 && { images: imageList }),
      };
    });
  } catch {
    // If DB is unavailable during build, skip dynamic routes gracefully.
  }

  // ── Dynamic gift-set routes ───────────────────────────────────────────────
  let giftSetRoutes: MetadataRoute.Sitemap = [];
  try {
    const giftSets = await prisma.giftSet.findMany({
      where: { isDraft: false },
      select: { id: true, updatedAt: true },
    });

    giftSetRoutes = giftSets.map((gs) => ({
      url: `${BASE_URL}/collections/gift-sets/${gs.id}`,
      lastModified: gs.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // If DB is unavailable during build, skip dynamic routes gracefully.
  }

  return [...staticRoutes, ...productRoutes, ...giftSetRoutes];
}
