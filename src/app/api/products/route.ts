import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'edge';
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
        collection: true, collections: true, isDraft: true,
        badge: true, notes: true,
        price: true, costPrice: true, salePrice: true,
        images: true, videoUrl: true, stock: true,
        description: true,
        createdAt: true, updatedAt: true,
      },
    });
    const products = raw.map((p) => ({
      ...p,
      ...parseNotes(p.notes),
      collections: (p.collections as any[] ?? []).map((c: any) => (typeof c === 'string' ? c : c.slug || '')),
    }));
    return NextResponse.json({ products });
  } catch (err) {
    console.error('PRODUCTS FETCH ERROR:', err);
    return NextResponse.json({ products: [] });
  }
}
