import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'collection-images.json';

export async function GET() {
  const images = await readJsonFile<Record<string, string>>(FILE, {});
  return NextResponse.json({ images });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { slug: string; imageUrl: string };
    const images = await readJsonFile<Record<string, string>>(FILE, {});
    images[body.slug] = body.imageUrl;
    await writeJsonFile(FILE, images);
    revalidatePath('/collections');
    revalidatePath('/collections/' + body.slug);
    return NextResponse.json({ success: true, images });
  } catch (err) {
    console.error('COLLECTION IMAGE SAVE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save' },
      { status: 500 }
    );
  }
}
