import prisma from '@/lib/prisma';

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    switch (filename) {
      case 'gift-sets.json': {
        const rows = await prisma.giftSet.findMany();
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          price: r.price,
          costPrice: r.costPrice,
          isDraft: r.isDraft,
          image: r.image,
          productIds: (r.productIds as string[]) || [],
          stock: r.stock,
          createdAt: r.createdAt.toISOString(),
        })) as T;
      }

      case 'products.json': {
        const rows = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            images: true,
            category: true,
            collection: true,
            notes: true,
            stock: true,
          },
        });
        return rows.map((r: any) => ({
          ...r,
          images: (r.images as string[]) || [],
          salePrice: r.salePrice ?? null,
        })) as T;
      }

      case 'site-settings.json': {
        const row = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
        if (!row) return fallback;
        const { id, createdAt, updatedAt, ...settings } = row;
        return settings as T;
      }

      case 'collection-images.json': {
        const rows = await prisma.collectionImage.findMany();
        const record: Record<string, { image: string; description: string }> = {};
        for (const r of rows) {
          record[r.slug] = { image: r.image, description: r.description };
        }
        return record as T;
      }

      case 'subscribers.json': {
        const rows = await prisma.subscriber.findMany();
        return rows.map((r: any) => ({
          email: r.email,
          subscribedAt: r.createdAt.toISOString(),
        })) as T;
      }

      default:
        return fallback;
    }
  } catch (err) {
    console.error(`readJsonFile error (${filename}):`, err);
    return fallback;
  }
}

export async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  try {
    switch (filename) {
      case 'gift-sets.json': {
        const items = data as Array<{
          id: string;
          name: string;
          description?: string;
          price: number;
          costPrice?: number;
          isDraft?: boolean;
          image?: string;
          productIds?: string[];
          stock?: number;
        }>;
        for (const item of items) {
          await prisma.giftSet.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              description: item.description ?? '',
              price: item.price,
              costPrice: item.costPrice ?? 0,
              isDraft: item.isDraft ?? true,
              image: item.image ?? '',
              productIds: item.productIds ?? [],
              stock: item.stock ?? 0,
            },
            create: {
              id: item.id,
              name: item.name,
              description: item.description ?? '',
              price: item.price,
              costPrice: item.costPrice ?? 0,
              isDraft: item.isDraft ?? true,
              image: item.image ?? '',
              productIds: item.productIds ?? [],
              stock: item.stock ?? 0,
            },
          });
        }
        break;
      }

      case 'products.json': {
        const items = data as Array<{ id: string; stock?: number }>;
        for (const item of items) {
          await prisma.product.update({
            where: { id: item.id },
            data: { stock: item.stock ?? 0 },
          });
        }
        break;
      }

      case 'site-settings.json': {
        const settings = data as Record<string, unknown>;
        const { id: _ignore, createdAt: _c, updatedAt: _u, ...safe } = settings;
        await prisma.siteSetting.upsert({
          where: { id: 'default' },
          update: safe,
          create: { id: 'default', ...safe },
        });
        break;
      }

      case 'collection-images.json': {
        const record = data as Record<string, { image?: string; description?: string }>;
        for (const [slug, val] of Object.entries(record)) {
          await prisma.collectionImage.upsert({
            where: { slug },
            update: { image: val.image ?? '', description: val.description ?? '' },
            create: { slug, image: val.image ?? '', description: val.description ?? '' },
          });
        }
        break;
      }

      case 'subscribers.json': {
        const items = data as Array<{ email: string }>;
        for (const item of items) {
          await prisma.subscriber.upsert({
            where: { email: item.email },
            update: {},
            create: { email: item.email },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error(`writeJsonFile error (${filename}):`, err);
  }
}
