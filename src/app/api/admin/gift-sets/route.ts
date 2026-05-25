import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'gift-sets.json');

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  productIds: string[];
  createdAt: string;
}

async function read(): Promise<GiftSet[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function write(data: GiftSet[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = await read();
  return NextResponse.json({ giftSets: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const giftSet: GiftSet = {
      id: 'gs' + Date.now(),
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price) || 0,
      image: body.image || '',
      productIds: body.productIds || [],
      createdAt: new Date().toISOString(),
    };
    const data = await read();
    data.push(giftSet);
    await write(data);
    return NextResponse.json({ success: true, giftSet });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create gift set' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await read();
    const index = data.findIndex((g) => g.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Gift set not found' }, { status: 404 });
    }
    data[index] = { ...data[index], ...body, price: parseFloat(body.price) || data[index].price };
    await write(data);
    return NextResponse.json({ success: true, giftSet: data[index] });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update gift set' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const data = await read();
    const filtered = data.filter((g) => g.id !== id);
    if (filtered.length === data.length) {
      return NextResponse.json({ success: false, error: 'Gift set not found' }, { status: 404 });
    }
    await write(filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete gift set' }, { status: 500 });
  }
}
