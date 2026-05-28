import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import type { CollectionData } from '@/types';

const FILE = 'collection-images.json';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function parseImages(raw: Record<string, unknown>): Record<string, CollectionData> {
  const result: Record<string, CollectionData> = {};
  for (const [slug, val] of Object.entries(raw)) {
    if (typeof val === 'string') {
      result[slug] = { image: val, description: '' };
    } else if (val && typeof val === 'object' && 'image' in (val as any)) {
      const v = val as Record<string, unknown>;
      result[slug] = { image: String(v.image || ''), description: String(v.description || '') };
    } else {
      result[slug] = { image: '', description: '' };
    }
  }
  return result;
}

export async function GET() {
  const raw = await readJsonFile<Record<string, unknown>>(FILE, {});
  const images = parseImages(raw);
  return NextResponse.json({ images });
}

export async function PUT(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const slug = formData.get('slug') as string | null;
      const file = formData.get('file') as File | null;

      if (!slug || !file) {
        return NextResponse.json({ success: false, error: 'Missing slug or file' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'city-fragrance/collections',
        resource_type: 'image',
      });

      const raw = await readJsonFile<Record<string, unknown>>(FILE, {});
      const images = parseImages(raw);
      images[slug] = {
        image: result.secure_url,
        description: images[slug]?.description || '',
      };
      await writeJsonFile(FILE, images);

      revalidatePath('/');
      revalidatePath('/collections');
      revalidatePath('/collections/' + slug);

      return NextResponse.json({ success: true, images, path: result.secure_url });
    }

    const body = (await request.json()) as { slug: string; imageUrl?: string; description?: string };
    const raw = await readJsonFile<Record<string, unknown>>(FILE, {});
    const images = parseImages(raw);
    const slug = body.slug;
    images[slug] = {
      image: body.imageUrl ?? images[slug]?.image ?? '',
      description: body.description ?? images[slug]?.description ?? '',
    };
    await writeJsonFile(FILE, images);

    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/collections/' + body.slug);
    revalidatePath('/collections', 'layout');
    return NextResponse.json({ success: true, images });
  } catch (err: any) {
    console.error('COLLECTION UPLOAD ERROR:', err);
    const message = err?.message || err?.error?.message || 'Failed to save collection image';
    const status = err?.http_code || 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
