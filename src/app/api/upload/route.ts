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

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'city-fragrance', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(buffer);
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
