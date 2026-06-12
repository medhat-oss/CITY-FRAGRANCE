import { NextResponse } from 'next/server';
import { revalidatePath, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import prisma from '@/lib/prisma';

const FILE = 'site-settings.json';

const getCachedDbSettings = cache(
  unstable_cache(
    async () => {
      return prisma.siteSetting.findUnique({ where: { id: 'default' } });
    },
    ['admin-settings'],
    { revalidate: 5, tags: ['settings'] }
  )
);

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  announcementText: string;
  heroBgImage: string;
  heroBgImageDesktop: string;
  heroVideoUrl: string;
  heroVideoMobile: string;
  moodTitle: string;
  moodSubtitle: string;
  moodImage: string;
  moodImageDesktop: string;
  moodVideoUrl: string;
  moodVideoMobile: string;
  womenCollectionVideoUrl: string;
  menCollectionVideoUrl: string;
  giftSetsVideoUrl: string;
  newArrivalsVideoUrl: string;
  allFragrancesVideoUrl: string;
  oudCollectionVideoUrl: string;
}

const ALL_KEYS: Array<keyof SiteSettings> = [
  'heroTitle', 'heroSubtitle', 'heroDescription', 'announcementText',
  'heroBgImage', 'heroBgImageDesktop', 'heroVideoUrl', 'heroVideoMobile',
  'moodTitle', 'moodSubtitle', 'moodImage', 'moodImageDesktop', 'moodVideoUrl', 'moodVideoMobile',
  'womenCollectionVideoUrl', 'menCollectionVideoUrl',
  'giftSetsVideoUrl', 'newArrivalsVideoUrl', 'allFragrancesVideoUrl', 'oudCollectionVideoUrl',
];

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

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function applyRecord(target: SiteSettings, source: Record<string, any>): SiteSettings {
  for (const key of ALL_KEYS) {
    if (source[key] !== undefined && source[key] !== null) {
      (target as any)[key] = source[key];
    }
  }
  return target;
}

export async function GET() {
  // 1. Try database first as the primary source of truth
  try {
    let dbSettings = await getCachedDbSettings();
    const merged = applyRecord({ ...DEFAULTS }, (dbSettings || {}) as any);
    return NextResponse.json(merged);
  } catch (err) {
    console.error('SETTINGS GET DB ERROR:', err);
  }

  // 2. Try Cloudinary raw URL
  if (cloudName) {
    try {
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/city-fragrance-data/${FILE}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const saved = (await res.json()) as Partial<SiteSettings>;
        return NextResponse.json({ ...DEFAULTS, ...saved });
      }
    } catch {
      // Cloudinary not reachable
    }
  }

  // 3. Fallback to local JSON
  const saved = await readJsonFile<Partial<SiteSettings>>(FILE, {});
  return NextResponse.json({ ...DEFAULTS, ...saved });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SiteSettings>;

    // Read current settings — DB first, then JSON fallback
    let current: SiteSettings;
    try {
      const dbSettings = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
      if (dbSettings) {
        current = applyRecord({ ...DEFAULTS }, dbSettings);
      } else {
        const savedJson = await readJsonFile<Partial<SiteSettings>>(FILE, {});
        current = { ...DEFAULTS, ...savedJson };
      }
    } catch {
      const savedJson = await readJsonFile<Partial<SiteSettings>>(FILE, {});
      current = { ...DEFAULTS, ...savedJson };
    }

    // Merge: body field kept if !== undefined (preserves "", "HIDDEN", any value)
    const updated: SiteSettings = { ...current };
    for (const key of ALL_KEYS) {
      if (body[key] !== undefined) {
        (updated as any)[key] = body[key];
      }
    }

    // Write to JSON file
    await writeJsonFile(FILE, updated);

    // Sync to PostgreSQL — update payload MUST NOT include 'id' (Prisma rejects PK in update)
    const createPayload: Record<string, any> = { id: 'default' };
    const updatePayload: Record<string, any> = {};
    for (const key of ALL_KEYS) {
      createPayload[key] = updated[key];
      updatePayload[key] = updated[key];
    }



    try {
      await prisma.siteSetting.upsert({
        where: { id: 'default' },
        update: updatePayload,
        create: createPayload,
      });
      // Call immediately after a successful database update to ensure instant UI invalidation
      revalidatePath('/', 'layout');
    } catch (dbErr: any) {
      console.error('PRISMA UPSERT ERROR:', dbErr?.message || dbErr);
      return NextResponse.json({
        success: false,
        error: `Database error: ${dbErr?.message || 'Unknown Prisma error'}`,
      }, { status: 500 });
    }


    // Purge Next.js server cache for every page that renders hero/mood media
    const pathsToRevalidate = [
      '/',
      '/collections',
      '/collections/all-fragrances',
      '/collections/mens-collection',
      '/collections/womens-collection',
      '/collections/oud-collection',
      '/collections/new-arrivals',
      '/collections/gift-sets',
      '/admin/settings',
      '/stores',
    ];
    for (const p of pathsToRevalidate) {
      try { revalidatePath(p); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('SETTINGS SAVE ERROR:', err);
    const message = err?.message || 'Failed to save settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
