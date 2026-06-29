import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductDetail from './product-detail';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

async function fetchProduct(id: string) {
  const result = await Promise.race([
    prisma.product.findUnique({
      where: { id },
      select: { name: true, description: true, images: true, category: true, isDraft: true },
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  return result;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let product: Awaited<ReturnType<typeof fetchProduct>>;
  try {
    product = await fetchProduct(id);
  } catch {
    return { title: 'City Fragrance' };
  }

  if (!product || product.isDraft) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for is not found or has been removed.',
    };
  }

  const rawImages = product?.images;
  const imageList: string[] = Array.isArray(rawImages)
    ? (rawImages as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const firstImage = imageList[0] ?? null;

  const title = product?.name ?? 'Product Not Found';
  const description = product?.description
    ? product.description.slice(0, 160)
    : 'Explore luxury fragrances from City Fragrance — premium perfumes & gift sets delivered across Egypt.';

  return {
    title,
    description,
    openGraph: {
      title: product ? `${product.name} | City Fragrance` : 'City Fragrance',
      description,
      images: firstImage
        ? [{ url: firstImage, width: 800, height: 1000, alt: product?.name ?? 'City Fragrance perfume' }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product ? `${product.name} | City Fragrance` : 'City Fragrance',
      description,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default function ProductPage({ params }: Props) {
  return <ProductDetail params={params} />;
}
