import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseNotes } from '@/lib/productUtils';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const raw = await prisma.product.findMany({
      where: { isDraft: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        collection: true,
        isDraft: true,
        badge: true,
        notes: true,
        price: true,
        salePrice: true,
        images: true,
        videoUrl: true,
        stock: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fetch collection relations via raw SQL (avoids WASM engine for many-to-many)
    let collectionMap = new Map<string, string[]>();
    try {
      const rows = (await prisma.$queryRawUnsafe(
        'SELECT ctp."A" AS product_id, c.slug FROM "_CollectionToProduct" ctp JOIN "Collection" c ON ctp."B" = c.id'
      )) as Array<{ product_id: string; slug: string }>;
      for (const row of rows) {
        const arr = collectionMap.get(row.product_id) || [];
        arr.push(row.slug);
        collectionMap.set(row.product_id, arr);
      }
    } catch {
      // If the join table query fails, serve products without collections
    }

    const products = raw.map((p: any) => ({
      ...p,
      ...parseNotes(p.notes),
      collections: collectionMap.get(p.id) || [],
    }));

    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('PRODUCTS FETCH ERROR:', err);
    return NextResponse.json(
      { products: [], error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
