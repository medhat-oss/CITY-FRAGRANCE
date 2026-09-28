
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateSignature } from '@/lib/cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 15MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only standard images and videos are permitted.' },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'city-fragrance';

    const params: Record<string, string> = { timestamp, folder };
    const signature = await generateSignature(params, apiSecret!);

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('folder', folder);
    cloudinaryForm.append('timestamp', timestamp);
    cloudinaryForm.append('api_key', apiKey!);
    cloudinaryForm.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: cloudinaryForm });

    if (!uploadRes.ok) {
      const errorBody = await uploadRes.text();
      console.error('CLOUDINARY UPLOAD ERROR:', uploadRes.status, errorBody);
      return NextResponse.json(
        { success: false, error: `Cloudinary upload failed: ${uploadRes.status}` },
        { status: uploadRes.status },
      );
    }

    const result = (await uploadRes.json()) as { secure_url: string; resource_type: string };

    let deliveryUrl = result.secure_url;
    if (result.resource_type === 'video') {
      deliveryUrl = deliveryUrl.replace('/video/upload/', '/video/upload/f_auto,q_auto:best/');
    } else {
      deliveryUrl = deliveryUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:best/');
    }

    return NextResponse.json({ success: true, path: deliveryUrl });
  } catch (err: any) {
    console.error('UPLOAD ERROR DETAILS:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 },
    );
  }
}
