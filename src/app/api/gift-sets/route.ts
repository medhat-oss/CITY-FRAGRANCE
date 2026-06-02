import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
  return NextResponse.json({ giftSets });
}
