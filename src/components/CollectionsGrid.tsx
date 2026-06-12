'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import type { CollectionData } from '@/types';
import { getOptimizedVideoUrl } from '@/lib/videoUtils';
import { dedupFetch } from '@/lib/dedupFetch';

interface Collection {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  videoUrl: string;
}

const COLLECTION_META: { id: string; title: string; href: string }[] = [
  { id: 'new-arrivals', title: 'New Arrivals', href: '/collections/new-arrivals' },
  { id: 'all-fragrances', title: 'All Fragrances', href: '/collections/all-fragrances' },
  { id: 'oud-collection', title: 'Oud Collection', href: '/collections/oud-collection' },
  { id: 'mens-collection', title: "Men's Collection", href: '/collections/mens-collection' },
  { id: 'womens-collection', title: "Women's Collection", href: '/collections/womens-collection' },
  { id: 'gift-sets', title: 'Gift Sets', href: '/collections/gift-sets' },
];



export default function CollectionsGrid({ initialImages = {} }: { initialImages?: Record<string, CollectionData> }) {
  const [collectionData, setCollectionData] = useState<Record<string, CollectionData>>(initialImages);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    dedupFetch<{ images: Record<string, CollectionData> }>('/api/collections')
      .then((data) => setCollectionData(data.images))
      .catch(() => {});
  }, []);

  const collections: Collection[] = COLLECTION_META.map((meta) => ({
    ...meta,
    description: collectionData[meta.id]?.description || '',
    image: collectionData[meta.id]?.image || '/images/product-placeholder.png',
    videoUrl: collectionData[meta.id]?.videoUrl || '',
  }));

  return (
    <div className="bg-[#09142E] min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-white/50 font-heading text-sm tracking-[0.3em] uppercase mb-4">
            City Fragrance
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-4">
            OUR COLLECTIONS
          </h1>
          <div className="w-16 h-px bg-white/20 mx-auto mt-6" />
          <p className="text-white/50 mt-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Explore the world of City Fragrance — where tradition meets modernity, and every scent tells a story.
          </p>
        </div>
      </section>

      {/* ─── Grid ─── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          {collections.map((collection, index) => (
            <Link
              key={`${collection.id}-${index}`}
              href={collection.href}
              prefetch={true}
              className="relative group w-full mx-auto cursor-pointer rounded-2xl overflow-hidden aspect-square transition-transform duration-300 ease-out hover:scale-[1.03] transform-gpu backface-hidden translate-z-0 will-change-transform"
            >
              {collection.videoUrl ? (
                <video
                  src={getOptimizedVideoUrl(collection.videoUrl)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover"
                />
              )}

              {/* Full-card Glassmorphic Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight mb-3">
                  {collection.title}
                </h3>
                {collection.description && (
                  <p className="font-body text-white/90 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-[90%] drop-shadow-sm">
                    {collection.description}
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
      </section>
    </div>
  );
}
