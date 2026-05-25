'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';

interface Collection {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
}

const COLLECTION_META: Omit<Collection, 'image'>[] = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    description: 'Explore our latest exquisite scents — fresh, contemporary, and crafted for the modern connoisseur.',
    href: '/collections/new-arrivals',
  },
  {
    id: 'all-fragrances',
    title: 'All Fragrances',
    description: 'Browse our complete universe of Arabic and international perfumes, from bold ouds to delicate florals.',
    href: '/collections/all-fragrances',
  },
  {
    id: 'oud-collection',
    title: 'Oud Collection',
    description: 'Rich, smoky, and deeply luxurious — our Oud Collection honors centuries of tradition.',
    href: '/collections/oud-collection',
  },
  {
    id: 'mens-collection',
    title: "Men's Collection",
    description: 'Bold, confident, and distinguished — fragrances that command attention and leave a lasting impression.',
    href: '/collections/mens-collection',
  },
  {
    id: 'womens-collection',
    title: "Women's Collection",
    description: 'Elegant, enchanting, and unforgettable — a celebration of femininity in every bottle.',
    href: '/collections/womens-collection',
  },
  {
    id: 'gift-sets',
    title: 'Gift Sets',
    description: 'Curated sets perfect for gifting — beautifully packaged, thoughtfully paired, and ready to impress.',
    href: '/collections/gift-sets',
  },
];

export default function CollectionsGrid({ initialImages = {} }: { initialImages?: Record<string, string> }) {
  const [collectionImages, setCollectionImages] = useState<Record<string, string>>(initialImages);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    if (Object.keys(initialImages).length > 0) return;
    fetch('/api/collections', { next: { revalidate: 60 } })
      .then((res) => res.json())
      .then((data: { images: Record<string, string> }) => setCollectionImages(data.images))
      .catch(() => {});
  }, [initialImages]);

  const collections: Collection[] = COLLECTION_META.map((meta) => ({
    ...meta,
    image: collectionImages[meta.id] || '/images/product-placeholder.png',
  }));

  return (
    <div className="bg-[#09142E] min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-gold/50 font-heading text-sm tracking-[0.3em] uppercase mb-4">
            City Fragrance
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-4">
            OUR COLLECTIONS
          </h1>
          <div className="w-16 h-px bg-gold/50 mx-auto mt-6" />
          <p className="text-white/50 mt-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Explore the world of City Fragrance — where tradition meets modernity, and every scent tells a story.
          </p>
        </div>
      </section>

      {/* ─── Grid ─── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              prefetch={true}
              className="group relative block h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:border-gold/40 hover:shadow-[0_0_50px_rgba(197,160,89,0.08)]"
            >
              {/* Background Image with Zoom */}
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09142E] via-[#09142E]/60 to-[#09142E]/20 transition-opacity duration-500 group-hover:from-[#09142E]" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
                <div className="mb-5">
                  <h3 className="font-heading text-3xl font-light text-white mb-1">
                    {collection.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                    {collection.description}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-12 h-px bg-gold/40 mb-4 transition-all duration-500 group-hover:w-full group-hover:bg-gold/60" />

                {/* CTA */}
                <span className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-white/70 transition-all duration-300 group-hover:text-gold group-hover:gap-3">
                  Explore Collection
                  <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
