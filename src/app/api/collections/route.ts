import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const images = await readJsonFile<Record<string, string>>('collection-images.json', {});
  return NextResponse.json({ images });
}
