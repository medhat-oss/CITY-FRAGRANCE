'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import { useLocale } from '@/context/LocaleContext';

interface Collection {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  href: string;
  image: string;
}

const COLLECTION_META: Omit<Collection, 'image'>[] = [
  {
    id: 'new-arrivals',
    titleEn: 'New Arrivals',
    titleAr: 'أحدث الإصدارات',
    descriptionEn: 'Discover our latest drops — fresh, contemporary scents crafted for the modern connoisseur.',
    descriptionAr: 'اكتشف أحدث إصداراتنا — عطور عصرية منعشة صُممت خصيصاً للخبير العصري.',
    href: '/collections/new-arrivals',
  },
  {
    id: 'all-fragrances',
    titleEn: 'All Fragrances',
    titleAr: 'جميع العطور',
    descriptionEn: 'Browse our complete universe of Arabic and international perfumes, from bold ouds to delicate florals.',
    descriptionAr: 'تصفح عالمنا الكامل من العطور العربية والعالمية، من العود الجريء إلى الأزهار الرقيقة.',
    href: '/collections/all-fragrances',
  },
  {
    id: 'oud-collection',
    titleEn: 'Oud Collection',
    titleAr: 'مجموعة العود',
    descriptionEn: 'Rich, smoky, and deeply luxurious — our Oud Collection honors centuries of tradition.',
    descriptionAr: 'غنية، دخانية، وفاخرة — مجموعة العود تحتفي بقرون من التقاليد العريقة.',
    href: '/collections/oud-collection',
  },
  {
    id: 'mens-collection',
    titleEn: "Men's Collection",
    titleAr: 'مجموعة الرجال',
    descriptionEn: 'Bold, confident, and distinguished — fragrances that command attention and leave a lasting impression.',
    descriptionAr: 'جريئة، واثقة، ومميزة — عطور تلفت الأنظار وتترك انطباعاً لا يُنسى.',
    href: '/collections/mens-collection',
  },
  {
    id: 'womens-collection',
    titleEn: "Women's Collection",
    titleAr: 'مجموعة النساء',
    descriptionEn: 'Elegant, enchanting, and unforgettable — a celebration of femininity in every bottle.',
    descriptionAr: 'أنيقة، ساحرة، ولا تُنسى — احتفال بالأنوثة في كل زجاجة.',
    href: '/collections/womens-collection',
  },
  {
    id: 'gift-sets',
    titleEn: 'Gift Sets',
    titleAr: 'المجموعات والهدايا',
    descriptionEn: 'Curated sets perfect for gifting — beautifully packaged, thoughtfully paired, and ready to impress.',
    descriptionAr: 'مجموعات منسقة مثالية للهدايا — بتغليف فاخر ومزيج مدروس بعناية.',
    href: '/collections/gift-sets',
  },
];

export default function CollectionsGrid({ initialImages = {} }: { initialImages?: Record<string, string> }) {
  const { dir } = useLocale();
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
    <div className="bg-[#09142E] min-h-screen" dir={dir}>
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
          <p className="font-heading text-2xl sm:text-3xl text-gold/80 font-light">
            مجموعاتنا
          </p>
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
                  alt={collection.titleEn}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Overlay — deepens on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09142E] via-[#09142E]/60 to-[#09142E]/20 transition-opacity duration-500 group-hover:from-[#09142E]" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
                {/* English */}
                <div className="mb-3">
                  <h3 className="font-heading text-3xl font-light text-white mb-1">
                    {collection.titleEn}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                    {collection.descriptionEn}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-12 h-px bg-gold/40 mb-4 transition-all duration-500 group-hover:w-full group-hover:bg-gold/60" />

                {/* Arabic */}
                <div dir="rtl" className="mb-5">
                  <h3 className="font-heading text-2xl font-light text-gold/80 mb-1 text-right">
                    {collection.titleAr}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed text-right">
                    {collection.descriptionAr}
                  </p>
                </div>

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
