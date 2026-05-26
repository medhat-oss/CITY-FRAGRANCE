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

export async function GET() {
  const saved = await readJsonFile<Partial<SiteSettings>>(FILE, {});
  const settings = { ...DEFAULTS, ...saved };
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
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
    revalidatePath('/');
    revalidatePath('/collections');
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error('SETTINGS SAVE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
