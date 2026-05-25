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

export async function GET() {
  const products = await readProducts();
  return NextResponse.json({ products }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
