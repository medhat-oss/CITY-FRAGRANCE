import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import type { CollectionData } from '@/types';

const FILE = 'collection-images.json';
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + secret;
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signStr));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const folder = 'city-fragrance/collections';

      const params: Record<string, string> = { timestamp, folder };
      const signature = await generateSignature(params, apiSecret!);

      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', file);
      cloudinaryForm.append('folder', folder);
      cloudinaryForm.append('timestamp', timestamp);
      cloudinaryForm.append('api_key', apiKey!);
      cloudinaryForm.append('signature', signature);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: cloudinaryForm });

      if (!uploadRes.ok) {
        const errorBody = await uploadRes.text();
        console.error('CLOUDINARY UPLOAD ERROR:', uploadRes.status, errorBody);
        return NextResponse.json(
          { success: false, error: `Cloudinary upload failed: ${uploadRes.status}` },
          { status: uploadRes.status },
        );
      }

      const result = (await uploadRes.json()) as { secure_url: string };
      const secureUrl = result.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto:best/');

      const raw = await readJsonFile<Record<string, unknown>>(FILE, {});
      const images = parseImages(raw);
      images[slug] = {
        image: secureUrl,
        description: images[slug]?.description || '',
      };
      await writeJsonFile(FILE, images);

      revalidatePath('/');
      revalidatePath('/collections');
      revalidatePath('/collections/' + slug);

      return NextResponse.json({ success: true, images, path: secureUrl });
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
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save collection image' },
      { status: 500 },
    );
  }
}
