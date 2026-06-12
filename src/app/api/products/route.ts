import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

const getCachedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      // Only select fields needed for storefront cards, POS inventory, and
      // collection filtering. Heavy text blobs (notes, description, videoUrl,
      // costPrice) are excluded to reduce payload size and serialization time.
      select: {
        id: true, name: true, type: true, category: true,
        collection: true, collections: true, isDraft: true,
        badge: true,
        price: true, salePrice: true,
        images: true, stock: true,
        createdAt: true, updatedAt: true,
      },
    });
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
