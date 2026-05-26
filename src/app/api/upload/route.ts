import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('CLOUDINARY CONFIG:', {
  cloud_name: cloudName,
  api_key: apiKey ? `set (${apiKey.length} chars)` : 'MISSING',
  api_secret: apiSecret ? `set (${apiSecret.length} chars)` : 'MISSING',
});

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'city-fragrance',
      resource_type: 'image',
    });

    return NextResponse.json({ success: true, path: result.secure_url });
  } catch (err: any) {
    console.error('UPLOAD ERROR DETAILS:', err);
    const message = err?.message || err?.error?.message || 'Upload failed';
    const status = err?.http_code || 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
