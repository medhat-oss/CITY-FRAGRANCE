import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', 'gift-sets.json'), 'utf-8');
    return NextResponse.json({ giftSets: JSON.parse(raw) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json({ giftSets: [] });
  }
}
