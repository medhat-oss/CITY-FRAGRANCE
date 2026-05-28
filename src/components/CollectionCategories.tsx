'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import { useLocale } from '@/context/LocaleContext';
import type { CollectionData } from '@/types';

interface Collection {
  title: string;
  subtitle: string;
  href: string;
  slug: string;
  image: string;
}

const COLLECTION_META: Omit<Collection, 'image' | 'subtitle'>[] = [
  { title: "Women's Collection", href: '/collections/womens-collection', slug: 'womens-collection' },
  { title: "Men's Collection", href: '/collections/mens-collection', slug: 'mens-collection' },
];

export default function CollectionCategories() {
  const { dir } = useLocale();
  const [collectionData, setCollectionData] = useState<Record<string, CollectionData> | null>(null);

  useEffect(() => {
    fetch('/api/collections', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { images: Record<string, CollectionData> }) => setCollectionData(data.images))
      .catch(() => setCollectionData({}));
  }, []);

  const collections: Collection[] = COLLECTION_META.map((meta) => ({
    ...meta,
    subtitle: collectionData?.[meta.slug]?.description || '',
    image: collectionData?.[meta.slug]?.image || '',
  }));

  const loaded = collectionData !== null;

  return (
    <section className="py-16 px-4 sm:px-8 bg-slate-50 dark:bg-[#09142E] border-b dark:border-slate-800" dir={dir}>
      <div className="max-w-container mx-auto">
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              prefetch={true}
              className="group relative overflow-hidden rounded-sm block h-[200px] sm:h-[360px] border border-white/10 dark:border-brandDark-border dark:bg-brandDark-card transition-all duration-700 ease-out hover:scale-[1.02]"
            >
              {!loaded ? (
                <div className="absolute inset-0 bg-slate-800/50 animate-pulse" />
              ) : (
                <Image
                  src={collection.image || '/images/product-placeholder.png'}
                  alt={collection.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent flex flex-col justify-end p-3 md:p-6 text-white">
                <h3 className="font-heading text-sm sm:text-base md:text-2xl font-light mb-1 leading-tight">
                  {collection.title}
                </h3>
                <p className="hidden sm:block text-xs text-white/90 mb-2.5">
                  {collection.subtitle}
                </p>
                <span className="font-heading text-[10px] sm:text-xs uppercase tracking-tight text-white flex items-center gap-1 transition-all duration-300 group-hover:gap-1.5">
                  Explore Now <HiArrowRight className="w-2.5 h-2.5 md:w-4 md:h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
