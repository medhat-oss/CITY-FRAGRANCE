import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  const products = await readJsonFile<any[]>('products.json', []);
  return NextResponse.json({ products });
}
