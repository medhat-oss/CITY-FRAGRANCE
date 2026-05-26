import { NextResponse } from 'next/server';
import { readJsonFile } from '@/lib/dataFile';

export async function GET() {
  const images = await readJsonFile<Record<string, string>>('collection-images.json', {});
  return NextResponse.json({ images });
}
