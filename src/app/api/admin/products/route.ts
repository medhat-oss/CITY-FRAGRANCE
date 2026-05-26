import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PRODUCTS_PATH = path.join(process.cwd(), 'data', 'products.json');

async function readProducts() {
  try {
    const raw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeProducts(products: unknown[]) {
  await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

export async function GET() {
  const products = await readProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const product = await request.json();
    const products = await readProducts();
    products.push(product);
    await writeProducts(products);
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
    const products = await readProducts();
    const index = products.findIndex((p: { id: string }) => p.id === updated.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    products[index] = updated;
    await writeProducts(products);
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
    const products = await readProducts();
    const filtered = products.filter((p: { id: string }) => p.id !== id);
    if (filtered.length === products.length) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    await writeProducts(filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PRODUCT DELETE DATABASE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}
