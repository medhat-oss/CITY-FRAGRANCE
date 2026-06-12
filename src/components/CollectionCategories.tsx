'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import { useLocale } from '@/context/LocaleContext';
import type { CollectionData } from '@/types';

import { getOptimizedVideoUrl } from '@/lib/videoUtils';

interface Collection {
  title: string;
  subtitle: string;
  href: string;
  slug: string;
  image: string;
  videoUrl: string;
}

const COLLECTION_META: Omit<Collection, 'image' | 'subtitle' | 'videoUrl'>[] = [
  { title: "Women's Collection", href: '/collections/womens-collection', slug: 'womens-collection' },
  { title: "Men's Collection", href: '/collections/mens-collection', slug: 'mens-collection' },
];

interface Props {
  collectionData: Record<string, CollectionData>;
}

export default function CollectionCategories({ collectionData }: Props) {
  const { dir } = useLocale();

  const collections: Collection[] = COLLECTION_META.map((meta) => ({
    ...meta,
    subtitle: collectionData?.[meta.slug]?.description || '',
    image: collectionData?.[meta.slug]?.image || '',
    videoUrl: collectionData?.[meta.slug]?.videoUrl || '',
  }));

  return (
    <section className="pt-4 pb-16 px-4 sm:px-8 bg-slate-50 dark:bg-[#09142E] border-b dark:border-slate-800" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {collections.map((collection, index) => (
            <Link
              key={`${collection.slug}-${index}`}
              href={collection.href}
              prefetch={true}
              className="relative group w-full cursor-pointer rounded-2xl overflow-hidden aspect-square transition-transform duration-300 ease-out hover:scale-[1.03] transform-gpu backface-hidden translate-z-0 will-change-transform"
            >
              {collection.videoUrl ? (
                <video
                  src={getOptimizedVideoUrl(collection.videoUrl)}
                  autoPlay loop muted playsInline preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={collection.image || '/images/product-placeholder.png'}
                  alt={collection.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              )}

              {/* Full-card Glassmorphic Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight mb-3">
                  {collection.title}
                </h3>
                {collection.subtitle && (
                  <p className="font-body text-white/90 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-[90%] drop-shadow-sm">
                    {collection.subtitle}
                  </p>
                )}
                <div className="w-12 sm:w-16 h-[2px] bg-white/40 mb-4 sm:mb-5 transition-all duration-500 group-hover:w-20 sm:group-hover:w-24" />
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 group-hover:gap-3">
                  Explore Collection
                  <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
