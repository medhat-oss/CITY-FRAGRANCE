import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { prisma } from '@/lib/prisma';

const FILE = 'products.json';

/** All known collection slugs that exist in the DB */
const KNOWN_SLUGS = [
  'womens-collection',
  'mens-collection',
  'new-arrivals',
  'gift-sets',
  'all-fragrances',
  'oud-collection',
];

/**
 * Ensure every slug in the array exists as a Collection row, then return
 * an array of { id } objects ready for Prisma connect/set.
 */
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
  revalidatePath('/');
  revalidatePath('/cashier');
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
  noStore();
  const products = await readJsonFile<any[]>(FILE, []);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const product = await request.json();

    // ── 1. persist to local JSON ──────────────────────────────────────────
    const products = await readJsonFile<any[]>(FILE, []);
    products.push(product);
    await writeJsonFile(FILE, products);

    // ── 2. sync to Prisma DB ─────────────────────────────────────────────
    const slugs: string[] = Array.isArray(product.collections)
      ? product.collections
      : product.collection
        ? [product.collection]
        : [];

    const collectionIds = await resolveCollectionIds(slugs);

    const dbData = {
      name: product.name,
      type: product.type || product.category || '',
      category: product.category || '',
      collection: product.collection || slugs[0] || '',
      isDraft: product.isDraft ?? true,
      badge: product.badge || '',
      notes: [product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • '),
      description: product.description || '',
      price: product.price,
      salePrice: product.salePrice || null,
      images: product.images || [],
      videoUrl: product.videoUrl || '',
      stock: product.stock !== undefined ? product.stock : 0,
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        ...dbData,
        collections: { set: collectionIds },
      },
      create: {
        id: product.id,
        ...dbData,
        collections: { connect: collectionIds },
      },
    });

    revalidateAll();
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

    // ── 1. persist to local JSON ──────────────────────────────────────────
    const products = await readJsonFile<any[]>(FILE, []);
    const index = products.findIndex((p: { id: string }) => p.id === updated.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    products[index] = updated;
    await writeJsonFile(FILE, products);

    // ── 2. sync to Prisma DB ─────────────────────────────────────────────
    const slugs: string[] = Array.isArray(updated.collections)
      ? updated.collections
      : updated.collection
        ? [updated.collection]
        : [];

    const collectionIds = await resolveCollectionIds(slugs);

    const dbData = {
      name: updated.name,
      type: updated.type || updated.category || '',
      category: updated.category || '',
      collection: updated.collection || slugs[0] || '',
      isDraft: updated.isDraft ?? false,
      badge: updated.badge || '',
      notes: [updated.topNotes, updated.middleNotes, updated.baseNotes].filter(Boolean).join(' • '),
      description: updated.description || '',
      price: updated.price,
      salePrice: updated.salePrice || null,
      images: updated.images || [],
      videoUrl: updated.videoUrl || '',
      stock: updated.stock !== undefined ? updated.stock : 0,
    };

    await prisma.product.upsert({
      where: { id: updated.id },
      update: {
        ...dbData,
        collections: { set: collectionIds },
      },
      create: {
        id: updated.id,
        ...dbData,
        collections: { connect: collectionIds },
      },
    });

    revalidateAll();
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

    // ── 1. remove from local JSON ─────────────────────────────────────────
    const products = await readJsonFile<any[]>(FILE, []);
    const filtered = products.filter((p: { id: string }) => p.id !== id);
    if (filtered.length === products.length) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    await writeJsonFile(FILE, filtered);

    // ── 2. remove from Prisma DB ─────────────────────────────────────────
    try {
      await prisma.product.delete({ where: { id } });
    } catch (e) {
      console.warn('Prisma product delete failed or did not exist:', e);
    }

    revalidateAll();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PRODUCT DELETE DATABASE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}
