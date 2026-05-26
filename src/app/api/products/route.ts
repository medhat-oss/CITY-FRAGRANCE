import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export async function GET() {
  const products = await readJsonFile<any[]>('products.json', []);
  return NextResponse.json({ products }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
