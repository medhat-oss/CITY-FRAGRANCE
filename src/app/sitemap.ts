import prisma from '@/lib/prisma';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://city-fragrance.malk35t-754.workers.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/stores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/collections`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/gift-sets`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  let giftSetEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await prisma.product.findMany({
      where: { isDraft: false },
      select: { id: true, updatedAt: true, images: true },
    });

    productEntries = products.map((p: any) => {
      const rawImages = p.images as unknown;
      const images: string[] = Array.isArray(rawImages)
        ? (rawImages as unknown[]).filter((v): v is string => typeof v === 'string')
        : [];

      return {
        url: `${BASE_URL}/product/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.9,
        images: images.length > 0 ? images : undefined,
      };
    });
  } catch (e) {
    console.error('Sitemap — product query failed:', e);
  }

  try {
    const giftSets = await prisma.giftSet.findMany({
      where: { isDraft: false },
      select: { id: true, updatedAt: true },
    });

    giftSetEntries = giftSets.map((g: any) => ({
      url: `${BASE_URL}/collections/gift-sets/${g.id}`,
      lastModified: g.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (e) {
    console.error('Sitemap — giftSet query failed:', e);
  }

  return [...staticEntries, ...productEntries, ...giftSetEntries];
}
