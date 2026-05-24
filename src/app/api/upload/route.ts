import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `hero-bg-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, path: `/uploads/${filename}` });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
