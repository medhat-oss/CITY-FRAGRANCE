import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Server-side in-memory cache with 5s TTL
let serverCache: { data: any; expiresAt: number } | null = null;
const SERVER_CACHE_TTL = 5_000;

// Maps collection slugs to the settings key that holds their video URL
const SLUG_TO_VIDEO_FIELD: Record<string, string> = {
  'womens-collection': 'womenCollectionVideoUrl',
  'mens-collection': 'menCollectionVideoUrl',
  'gift-sets': 'giftSetsVideoUrl',
  'new-arrivals': 'newArrivalsVideoUrl',
  'all-fragrances': 'allFragrancesVideoUrl',
  'oud-collection': 'oudCollectionVideoUrl',
};

export async function GET() {
  const now = Date.now();
  if (serverCache && now < serverCache.expiresAt) {
    return NextResponse.json(serverCache.data);
  }

  const [images, settings] = await Promise.all([
    readJsonFile<Record<string, any>>('collection-images.json', {}),
    readJsonFile<Record<string, any>>('site-settings.json', {}),
  ]);

  // Inject video URLs from settings into every collection that has a video field
  for (const [slug, settingsKey] of Object.entries(SLUG_TO_VIDEO_FIELD)) {
    if (!images[slug]) {
      images[slug] = { image: '', description: '' };
    }
    images[slug].videoUrl = settings[settingsKey] || '';
  }

  const data = { images };
  serverCache = { data, expiresAt: now + SERVER_CACHE_TTL };
  return NextResponse.json(data);
}
