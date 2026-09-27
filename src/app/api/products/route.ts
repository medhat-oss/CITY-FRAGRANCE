import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function parseNotes(notes: string) {
  const parts = (notes || '').split(' • ');
  return {
    topNotes: parts[0] ?? '',
    middleNotes: parts[1] ?? '',
    baseNotes: parts[2] ?? '',
  };
}

export async function GET() {
  try {
    const raw = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, category: true,
        collection: true, isDraft: true,
        badge: true, notes: true,
        price: true, costPrice: true, salePrice: true,
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
    return NextResponse.json({ products: [], error: 'Failed to fetch products' }, { status: 200 });
  }
}
