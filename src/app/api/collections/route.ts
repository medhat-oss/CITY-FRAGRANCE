import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

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
  const images = await readJsonFile<Record<string, any>>('collection-images.json', {});
  const settings = await readJsonFile<Record<string, any>>('site-settings.json', {});

  // Inject video URLs from settings into every collection that has a video field
  for (const [slug, settingsKey] of Object.entries(SLUG_TO_VIDEO_FIELD)) {
    if (!images[slug]) {
      images[slug] = { image: '', description: '' };
    }
    images[slug].videoUrl = settings[settingsKey] || '';
  }

  return NextResponse.json({ images });
}
