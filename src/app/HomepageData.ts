import prisma from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';
import type { SiteSettings, CollectionData } from '@/types';
import { SITE_DEFAULTS as DEFAULTS, SLUG_TO_VIDEO_FIELD } from '@/lib/siteDefaults';

export interface HomepageData {
  settings: SiteSettings;
  collectionImages: Record<string, CollectionData>;
  bestSellers: Array<{
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    images: string[];
    badge: string;
    stock: number;
    updatedAt: Date;
  }>;
}

export async function loadHomepageData(): Promise<HomepageData> {
  const [settingsDb, settingsJson, collectionImages, recentProducts] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: 'default' } }).catch(() => null),
    readJsonFile<Partial<SiteSettings>>('site-settings.json', {}),
    readJsonFile<Record<string, CollectionData>>('collection-images.json', {}),
    prisma.product.findMany({
      where: { isDraft: { not: true } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        images: true,
        badge: true,
        stock: true,
        updatedAt: true,
      },
    }),
  ]);

  const settings = { ...DEFAULTS, ...settingsJson, ...(settingsDb || {}) } as SiteSettings;

  for (const [slug, settingsKey] of Object.entries(SLUG_TO_VIDEO_FIELD)) {
    if (!collectionImages[slug]) {
      collectionImages[slug] = { image: '', description: '' } as CollectionData;
    }
    collectionImages[slug].videoUrl = (settings as any)[settingsKey] || '';
  }

  const bestSellers = recentProducts
    .filter(
      (p: any) =>
        p.badge &&
        (p.badge.toUpperCase().includes('BEST SELLER') ||
          p.badge.toUpperCase().includes('SALE'))
    )
    .slice(0, 4);

  return { settings, collectionImages, bestSellers };
}
