import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function parseNotes(notes: string) {
  const parts = (notes || '').split(' • ');
  return {
    topNotes: parts[0] ?? '',
    middleNotes: parts[1] ?? '',
    baseNotes: parts[2] ?? '',
  };
}

const getCachedProducts = unstable_cache(
  async () => {
    const raw = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, category: true,
        collection: true, collections: true, isDraft: true,
        badge: true, notes: true,
        price: true, costPrice: true, salePrice: true,
        images: true, videoUrl: true, stock: true,
        description: true,
        createdAt: true, updatedAt: true,
      },
    });
    return raw.map((p) => ({
      ...p,
      ...parseNotes(p.notes),
    }));
  },
  ['api-products'],
  { revalidate: 5, tags: ['products'] }
);

export async function GET() {
  try {
    const products = await getCachedProducts();
    return NextResponse.json({ products });
  } catch (err) {
    console.error('PRODUCTS FETCH ERROR:', err);
    return NextResponse.json({ products: [] });
  }
}
