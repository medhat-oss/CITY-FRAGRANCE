import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'site-settings.json';

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  heroBgImage: string;
  moodTitle: string;
  moodSubtitle: string;
  moodImage: string;
}

const DEFAULTS: SiteSettings = {
  heroTitle: 'Celebrate in Luxury & Scent',
  heroSubtitle: 'Eid Al Adha Special',
  announcementText: 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
  heroBgImage: '/images/hero-banner.png',
  moodTitle: 'The Essence of Luxury & Elegance',
  moodSubtitle: 'Discover timeless scents crafted for those who appreciate the finer things in life.',
  moodImage: '/images/hero-banner.png',
};

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export async function GET() {
  // 1. Try Cloudinary raw URL directly (source of truth)
  if (cloudName) {
    try {
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/city-fragrance-data/${FILE}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const saved = (await res.json()) as Partial<SiteSettings>;
        return NextResponse.json({ ...DEFAULTS, ...saved });
      }
    } catch {
      // Cloudinary not reachable — fall through
    }
  }

  // 2. Fallback to local / build folder via readJsonFile
  const saved = await readJsonFile<Partial<SiteSettings>>(FILE, {});
  const settings = { ...DEFAULTS, ...saved };
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const saved = await readJsonFile<Partial<SiteSettings>>(FILE, {});
    const current = { ...DEFAULTS, ...saved };
    const updated: SiteSettings = {
      heroTitle: body.heroTitle ?? current.heroTitle,
      heroSubtitle: body.heroSubtitle ?? current.heroSubtitle,
      announcementText: body.announcementText ?? current.announcementText,
      heroBgImage: body.heroBgImage ?? current.heroBgImage,
      moodTitle: body.moodTitle ?? current.moodTitle,
      moodSubtitle: body.moodSubtitle ?? current.moodSubtitle,
      moodImage: body.moodImage ?? current.moodImage,
    };
    await writeJsonFile(FILE, updated);
    console.log('SETTINGS SAVED to local and Cloudinary (if configured)');
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/stores');
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('SETTINGS SAVE ERROR:', err);
    const message = err?.message || 'Failed to save settings';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
