import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** All known collection slugs that exist in the DB */
const KNOWN_SLUGS = [
  'womens-collection',
  'mens-collection',
  'new-arrivals',
  'gift-sets',
  'all-fragrances',
  'oud-collection',
];

function toSlug(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return (typeof o.slug === 'string' ? o.slug : typeof o.name === 'string' ? o.name : '') as string;
  }
  return '';
}

/** Coerce collection and collections into a clean slug array */
function extractSlugs(body: Record<string, unknown>): string[] {
  const raw = Array.isArray(body.collections) ? body.collections : [];
  const slugs = raw.map(toSlug).filter(Boolean);
  if (slugs.length > 0) return slugs;
  const single = toSlug(body.collection);
  return single ? [single] : [];
}

async function resolveCollectionIds(slugs: string[]): Promise<{ id: string }[]> {
  if (!slugs || slugs.length === 0) return [];
  const unique = [...new Set(slugs.filter((s) => KNOWN_SLUGS.includes(s)))];
  if (unique.length === 0) return [];
  const rows = await prisma.collection.findMany({
    where: { slug: { in: unique } },
    select: { id: true },
  });
  return rows.map((r) => ({ id: r.id }));
}

function revalidateAll() {
  revalidateTag('products');
  revalidatePath('/');
  revalidatePath('/cashier');
  revalidatePath('/admin');
  revalidatePath('/admin/products');
  revalidatePath('/admin/analytics');
  revalidatePath('/collections/all-fragrances');
  revalidatePath('/collections/mens-collection');
  revalidatePath('/collections/womens-collection');
  revalidatePath('/collections/oud-collection');
  revalidatePath('/collections/new-arrivals');
  revalidatePath('/collections/gift-sets');
  revalidatePath('/product/[id]', 'page');
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, category: true,
        collection: true, collections: true, isDraft: true,
        badge: true, notes: true, description: true,
        price: true, costPrice: true, salePrice: true,
        images: true, videoUrl: true, stock: true,
        createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json({ products });
  } catch (err) {
    console.error('PRODUCTS GET ERROR:', err);
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: Request) {
  try {
    const product = await request.json();

    const slugs = extractSlugs(product);
    const collectionIds = await resolveCollectionIds(slugs);

    const dbData = {
      name: product.name,
      type: product.type || product.category || '',
      category: product.category || '',
      collection: slugs[0] || '',
      isDraft: product.isDraft ?? true,
      badge: product.badge || '',
      notes: [product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • '),
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      costPrice: product.costPrice ? parseFloat(product.costPrice) : 0,
      salePrice: product.salePrice || null,
      images: product.images || [],
      videoUrl: product.videoUrl || '',
      stock: product.stock !== undefined ? product.stock : 0,
    };

    const created = await prisma.product.upsert({
      where: { id: product.id },
      update: { ...dbData, collections: { set: collectionIds } },
      create: { id: product.id, ...dbData, collections: { connect: collectionIds } },
    });

    revalidateAll();
    return NextResponse.json({ success: true, product: created });
  } catch (err) {
    console.error('PRODUCT ADD ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to add product' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updated = await request.json();

    const slugs = extractSlugs(updated);
    const collectionIds = await resolveCollectionIds(slugs);

    const dbData = {
      name: updated.name,
      type: updated.type || updated.category || '',
      category: updated.category || '',
      collection: slugs[0] || '',
      isDraft: updated.isDraft ?? false,
      badge: updated.badge || '',
      notes: [updated.topNotes, updated.middleNotes, updated.baseNotes].filter(Boolean).join(' • '),
      description: updated.description || '',
      price: parseFloat(updated.price) || 0,
      costPrice: updated.costPrice ? parseFloat(updated.costPrice) : 0,
      salePrice: updated.salePrice || null,
      images: updated.images || [],
      videoUrl: updated.videoUrl || '',
      stock: updated.stock !== undefined ? updated.stock : 0,
    };

    const saved = await prisma.product.upsert({
      where: { id: updated.id },
      update: { ...dbData, collections: { set: collectionIds } },
      create: { id: updated.id, ...dbData, collections: { connect: collectionIds } },
    });

    revalidateAll();
    return NextResponse.json({ success: true, product: saved });
  } catch (err) {
    console.error('PRODUCT UPDATE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update product' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string };

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found in database' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    revalidateAll();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PRODUCT DELETE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 },
    );
  }
}
