import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';

const KNOWN_SLUGS = new Set([
  'womens-collection',
  'mens-collection',
  'new-arrivals',
  'all-fragrances',
  'oud-collection',
]);

function extractString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return (typeof o.slug === 'string' ? o.slug : typeof o.name === 'string' ? o.name : '') as string;
  }
  return '';
}

function buildDbData(body: Record<string, unknown>) {
  const rawCollections = Array.isArray(body.collections) ? body.collections : [];
  const slugs: string[] = [];
  for (const item of rawCollections) {
    const s = extractString(item);
    if (s) slugs.push(s);
  }
  if (slugs.length === 0) {
    const s = extractString(body.collection);
    if (s) slugs.push(s);
  }

  const collectionOps = slugs
    .filter((s) => KNOWN_SLUGS.has(s))
    .map((s) => ({ slug: s }));

  const scalarData = {
    name: String(body.name ?? ''),
    type: String(body.type || body.category || ''),
    category: String(body.category || ''),
    collection: slugs[0] ?? '',
    isDraft: body.isDraft === true || body.isDraft === 'true',
    badge: String(body.badge ?? ''),
    notes: [body.topNotes || '', body.middleNotes || '', body.baseNotes || ''].join(' • '),
    description: String(body.description ?? ''),
    price: Number(body.price) || 0,
    costPrice: body.costPrice !== undefined && body.costPrice !== null && body.costPrice !== ''
      ? Number(body.costPrice)
      : 0,
    salePrice: body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== ''
      ? Number(body.salePrice)
      : null,
    images: Array.isArray(body.images) ? body.images : [],
    videoUrl: String(body.videoUrl ?? ''),
    stock: (() => {
      const n = Number(body.stock);
      return Number.isFinite(n) ? Math.floor(n) : 0;
    })(),
  };

  const id = String(body.id ?? '');

  return { scalarData, collectionOps, id };
}

function revalidateAll() {
  revalidatePath('/', 'layout');
  revalidatePath('/products', 'layout');
  revalidatePath('/collections/all-fragrances', 'layout');
  revalidatePath('/admin', 'layout');
  revalidatePath('/api/products');
}

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
        badge: true, notes: true, description: true,
        price: true, costPrice: true, salePrice: true,
        images: true, videoUrl: true, stock: true,
        createdAt: true, updatedAt: true,
      },
    });
    const products = raw.map((p: any) => ({
      ...p,
      ...parseNotes(p.notes),
    }));
    return NextResponse.json({ products });
  } catch (err) {
    console.error('PRODUCTS GET ERROR:', err);
    return NextResponse.json({ products: [] });
  }
}

async function upsertProduct(id: string, scalarData: Record<string, unknown>, collectionOps: { slug: string }[], isCreate: boolean) {
  const data = { id, ...scalarData };

  const product = await prisma.product.upsert({
    where: { id },
    update: data as any,
    create: data as any,
  });

  await prisma.$executeRaw`DELETE FROM "_CollectionToProduct" WHERE "B" = ${id}`;

  if (collectionOps.length > 0) {
    const slugs = collectionOps.map((c) => c.slug);
    const collections = await prisma.collection.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    for (const c of collections) {
      await prisma.$executeRaw`INSERT INTO "_CollectionToProduct" ("A", "B") VALUES (${c.id}, ${id})`;
    }
  }

  return product;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scalarData, collectionOps, id } = buildDbData(body);

    const created = await upsertProduct(id, scalarData, collectionOps, true);

    revalidateAll();
    return NextResponse.json({ success: true, product: created });
  } catch (err) {
    console.error('PRODUCT ADD ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { scalarData, collectionOps, id } = buildDbData(body);

    const saved = await upsertProduct(id, scalarData, collectionOps, false);

    revalidateAll();
    return NextResponse.json({ success: true, product: saved });
  } catch (err) {
    console.error('PRODUCT UPDATE ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
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
