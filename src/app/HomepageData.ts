import prisma from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';
import type { SiteSettings, CollectionData } from '@/types';

const DEFAULTS: SiteSettings = {
  heroTitle: 'Celebrate in Luxury & Scent',
  heroSubtitle: 'Eid Al Adha Special',
  heroDescription: 'Exclusive Eid collection — enjoy 20% off on all premium fragrances.',
  announcementText: 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
  heroBgImage: '/images/hero-banner.png',
  heroBgImageDesktop: '',
  heroVideoUrl: '',
  heroVideoMobile: '',
  moodTitle: 'The Essence of Luxury & Elegance',
  moodSubtitle: 'Discover timeless scents crafted for those who appreciate the finer things in life.',
  moodImage: '/images/hero-banner.png',
  moodImageDesktop: '',
  moodVideoUrl: '',
  moodVideoMobile: '',
  womenCollectionVideoUrl: '',
  menCollectionVideoUrl: '',
  giftSetsVideoUrl: '',
  newArrivalsVideoUrl: '',
  allFragrancesVideoUrl: '',
  oudCollectionVideoUrl: '',
};

const SLUG_TO_VIDEO_FIELD: Record<string, string> = {
  'womens-collection': 'womenCollectionVideoUrl',
  'mens-collection': 'menCollectionVideoUrl',
  'gift-sets': 'giftSetsVideoUrl',
  'new-arrivals': 'newArrivalsVideoUrl',
  'all-fragrances': 'allFragrancesVideoUrl',
  'oud-collection': 'oudCollectionVideoUrl',
};

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
