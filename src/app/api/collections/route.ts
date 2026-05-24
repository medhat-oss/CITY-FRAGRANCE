import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection-images.json');

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const images = JSON.parse(raw);
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: {} });
  }
}
