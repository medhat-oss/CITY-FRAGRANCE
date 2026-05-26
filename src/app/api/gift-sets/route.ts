import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export async function GET() {
  const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
  return NextResponse.json({ giftSets }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
