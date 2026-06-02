import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await readJsonFile<any[]>('products.json', []);
  return NextResponse.json({ products });
}
