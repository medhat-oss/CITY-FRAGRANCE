import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
  return NextResponse.json({ giftSets });
}
