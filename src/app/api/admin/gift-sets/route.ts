import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'gift-sets.json';

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  productIds: string[];
  createdAt: string;
  stock?: number;
}

export async function GET() {
  noStore();
  const data = await readJsonFile<GiftSet[]>(FILE, []);
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
      stock: typeof body.stock === 'number' ? body.stock : parseInt(body.stock) || 0,
      createdAt: new Date().toISOString(),
    };
    const data = await readJsonFile<GiftSet[]>(FILE, []);
    data.push(giftSet);
    await writeJsonFile(FILE, data);
    revalidatePath('/');
    revalidatePath('/cashier');
    revalidatePath('/admin/analytics');
    revalidatePath('/collections/gift-sets');
    revalidatePath('/collections/gift-sets', 'layout');
    return NextResponse.json({ success: true, giftSet });
  } catch (err) {
    console.error('GIFT SET CREATE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create gift set' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await readJsonFile<GiftSet[]>(FILE, []);
    const index = data.findIndex((g) => g.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Gift set not found' }, { status: 404 });
    }
    data[index] = { ...data[index], ...body, price: parseFloat(body.price) || data[index].price };
    await writeJsonFile(FILE, data);
    revalidatePath('/');
    revalidatePath('/cashier');
    revalidatePath('/admin/analytics');
    revalidatePath('/collections/gift-sets');
    revalidatePath('/collections/gift-sets', 'layout');
    return NextResponse.json({ success: true, giftSet: data[index] });
  } catch (err) {
    console.error('GIFT SET UPDATE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update gift set' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const data = await readJsonFile<GiftSet[]>(FILE, []);
    const filtered = data.filter((g) => g.id !== id);
    if (filtered.length === data.length) {
      return NextResponse.json({ success: false, error: 'Gift set not found' }, { status: 404 });
    }
    await writeJsonFile(FILE, filtered);
    revalidatePath('/');
    revalidatePath('/cashier');
    revalidatePath('/admin/analytics');
    revalidatePath('/collections/gift-sets');
    revalidatePath('/collections/gift-sets', 'layout');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('GIFT SET DELETE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete gift set' },
      { status: 500 }
    );
  }
}
