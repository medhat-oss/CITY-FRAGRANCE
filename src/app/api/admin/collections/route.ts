import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection-images.json');

async function readImages(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeImages(data: Record<string, string>) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const images = await readImages();
  return NextResponse.json({ images });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { slug: string; imageUrl: string };
    const images = await readImages();
    images[body.slug] = body.imageUrl;
    await writeImages(images);
    return NextResponse.json({ success: true, images });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save' },
      { status: 500 }
    );
  }
}
