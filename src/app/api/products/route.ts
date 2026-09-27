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
        id: true, name: true, type: true, category: true,
        collection: true,
        badge: true, notes: true,
        price: true, salePrice: true,
        images: true, videoUrl: true, stock: true,
        description: true,
        createdAt: true, updatedAt: true,
      },
    });
    const products = raw.map((p: any) => ({
      ...p,
      ...parseNotes(p.notes),
    }));
    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('PRODUCTS FETCH ERROR:', err);
    return NextResponse.json({ products: [], error: 'Failed to fetch products' }, { status: 500 });
  }
}
