import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

// Public storefront endpoint — only returns PUBLISHED gift sets

export const dynamic = 'force-dynamic';

export async function GET() {
  const all = await readJsonFile<any[]>('gift-sets.json', []);
  // filter out drafts; also accept missing isDraft field (treated as published for legacy data)
  const published = all.filter((gs) => gs.isDraft !== true);
  return NextResponse.json({ giftSets: published });
}
