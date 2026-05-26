import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'collection-images.json';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const images = await readJsonFile<Record<string, string>>(FILE, {});
  return NextResponse.json({ images });
}

export async function PUT(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // ── Upload + Save in one call (like products) ──
      const formData = await request.formData();
      const slug = formData.get('slug') as string | null;
      const file = formData.get('file') as File | null;

      if (!slug || !file) {
        return NextResponse.json({ success: false, error: 'Missing slug or file' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'city-fragrance/collections', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        );
        stream.end(buffer);
      });

      const images = await readJsonFile<Record<string, string>>(FILE, {});
      images[slug] = result.secure_url;
      await writeJsonFile(FILE, images);

      revalidatePath('/collections');
      revalidatePath('/collections/' + slug);

      return NextResponse.json({ success: true, images, path: result.secure_url });
    }

    // ── Legacy JSON-only save (URL already known) ──
    const body = (await request.json()) as { slug: string; imageUrl: string };
    const images = await readJsonFile<Record<string, string>>(FILE, {});
    images[body.slug] = body.imageUrl;
    await writeJsonFile(FILE, images);

    revalidatePath('/collections');
    revalidatePath('/collections/' + body.slug);

    return NextResponse.json({ success: true, images });
  } catch (err) {
    console.error('COLLECTION UPLOAD ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save collection image' },
      { status: 500 }
    );
  }
}
