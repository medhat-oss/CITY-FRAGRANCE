import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'site-settings.json');

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  heroBgImage: string;
}

const DEFAULTS: SiteSettings = {
  heroTitle: 'Celebrate in Luxury & Scent',
  heroSubtitle: 'Eid Al Adha Special',
  announcementText: 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
  heroBgImage: '/images/hero-banner.png',
};

async function readSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function writeSettings(settings: SiteSettings): Promise<void> {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const current = await readSettings();
    const updated: SiteSettings = {
      heroTitle: body.heroTitle ?? current.heroTitle,
      heroSubtitle: body.heroSubtitle ?? current.heroSubtitle,
      announcementText: body.announcementText ?? current.announcementText,
      heroBgImage: body.heroBgImage ?? current.heroBgImage,
    };
    await writeSettings(updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
