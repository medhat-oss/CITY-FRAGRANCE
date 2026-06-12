import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;



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
      resource_type: 'auto',
    });

    let deliveryUrl = result.secure_url;
    if (result.resource_type === 'video') {
      // q_auto:best = highest Cloudinary quality preset — prevents luxury video from being over-compressed
      deliveryUrl = deliveryUrl.replace('/video/upload/', '/video/upload/f_auto,q_auto:best/');
    } else if (result.resource_type === 'image') {
      deliveryUrl = deliveryUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:best/');
    }

    return NextResponse.json({ success: true, path: deliveryUrl });
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
