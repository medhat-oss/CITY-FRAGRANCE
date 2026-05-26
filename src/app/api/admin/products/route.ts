import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'products.json';

export async function GET() {
  const products = await readJsonFile<any[]>(FILE, []);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const product = await request.json();
    const products = await readJsonFile<any[]>(FILE, []);
    products.push(product);
    await writeJsonFile(FILE, products);
    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error('PRODUCT ADD DATABASE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updated = await request.json();
    const products = await readJsonFile<any[]>(FILE, []);
    const index = products.findIndex((p: { id: string }) => p.id === updated.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    products[index] = updated;
    await writeJsonFile(FILE, products);
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error('PRODUCT UPDATE DATABASE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as { id: string };
    const products = await readJsonFile<any[]>(FILE, []);
    const filtered = products.filter((p: { id: string }) => p.id !== id);
    if (filtered.length === products.length) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    await writeJsonFile(FILE, filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PRODUCT DELETE DATABASE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}
