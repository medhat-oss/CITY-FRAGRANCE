'use client';
export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import { HiArrowRight } from 'react-icons/hi2';

const COLLECTION_META: Record<string, { title: string; description: string }> = {
  'new-arrivals': {
    title: 'NEW ARRIVALS',
    description: 'Explore our latest exquisite scents — fresh, contemporary, and crafted for the modern connoisseur.',
  },
  'all-fragrances': {
    title: 'ALL FRAGRANCES',
    description: 'Browse our complete universe of Arabic and international perfumes, from bold ouds to delicate florals.',
  },
  'oud-collection': {
    title: 'OUD COLLECTION',
    description: 'Rich, smoky, and deeply luxurious — our Oud Collection honors centuries of tradition.',
  },
  'mens-collection': {
    title: "MEN'S COLLECTION",
    description: 'Bold, confident, and distinguished — fragrances that command attention and leave a lasting impression.',
  },
  'womens-collection': {
    title: "WOMEN'S COLLECTION",
    description: 'Elegant, enchanting, and unforgettable — a celebration of femininity in every bottle.',
  },
  'gift-sets': {
    title: 'GIFT SETS',
    description: 'Curated sets perfect for gifting — beautifully packaged, thoughtfully paired, and ready to impress.',
  },
};

const EMPTY_MESSAGES: Record<string, { line1: string; line2: string }> = {
  'new-arrivals': { line1: 'Discovering new scents soon...', line2: 'Our perfumers are crafting something extraordinary.' },
  'oud-collection': { line1: 'Curating the finest ouds...', line2: 'Timeless classics are being selected for you.' },
  'all-fragrances': { line1: 'Building our fragrance universe...', line2: 'A world of scents is coming your way.' },
  'mens-collection': { line1: 'Forging bold new signatures...', line2: 'Confident scents are on the horizon.' },
  'womens-collection': { line1: 'Bottling elegance itself...', line2: 'Enchanting fragrances arriving soon.' },
  'gift-sets': { line1: 'Wrapping thoughtful surprises...', line2: 'Perfectly paired sets are being prepared.' },
};

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  productIds: string[];
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getProductsByCollection, products } = useProducts();
  const [giftSets, setGiftSets] = useState<GiftSet[]>([]);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (slug === 'gift-sets') {
      fetch('/api/gift-sets', { cache: 'no-store' }).then((r) => r.json()).then((d) => setGiftSets(d.giftSets || [])).catch(() => {});
    }
    fetch('/api/collections').then((r) => r.json()).then((d) => {
      const img = d.images?.[slug];
      if (img) setHeroImage(img);
    }).catch(() => {});
  }, [slug]);

  const meta = COLLECTION_META[slug];
  const emptyMsg = EMPTY_MESSAGES[slug] ?? { line1: 'Discovering new scents soon...', line2: '' };

  const collectionProducts =
    slug === 'all-fragrances'
      ? products
      : getProductsByCollection(slug);

  if (!meta) {
    return (
      <div className="bg-[#09142E] min-h-screen text-white">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center">
            <p className="text-white/40 text-lg">Collection not found</p>
            <Link href="/collections" className="text-white hover:underline mt-4 inline-block">
              &larr; Back to Collections
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#09142E] min-h-screen text-white">
      <Header />
      <main>
        {/* Hero */}
        <section className={`relative pt-32 pb-16 overflow-hidden ${heroImage ? 'bg-cover bg-center bg-no-repeat' : ''}`} style={heroImage ? { backgroundImage: `url('${heroImage}')` } : undefined}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] via-transparent to-transparent mix-blend-overlay" />
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <p className="text-white/50 font-heading text-sm tracking-[0.3em] uppercase mb-4">
              City Fragrance
            </p>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-4">
              {meta.title}
            </h1>
            <div className="w-16 h-px bg-gold/50 mx-auto mt-6" />
            <p className="text-white/50 mt-8 max-w-2xl mx-auto text-lg leading-relaxed">
              {meta.description}
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          {slug === 'gift-sets' ? (
            giftSets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg">{emptyMsg.line1}</p>
                <Link href="/collections" className="inline-flex items-center gap-2 mt-8 text-white/70 hover:text-white font-heading text-sm tracking-wider uppercase transition-colors">
                  <HiArrowRight className="rotate-180" />
                  Back to Collections
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {giftSets.map((gs) => {
                  const includedProducts = gs.productIds.map((pid) => products.find((p) => p.id === pid)).filter(Boolean) as typeof products;
                  return (
                    <Link key={gs.id} href={`/collections/gift-sets/${gs.id}`} className="group block">
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-visible transition-all duration-500 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                        <div className="relative aspect-square overflow-hidden bg-transparent">
                          <Image src={gs.image || '/images/product-placeholder.png'} alt={gs.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
                        </div>
                      <div className="p-3 sm:p-6">
                        <span className="text-xs uppercase tracking-widest text-white/60 mb-1 block">Gift Set</span>
                        <h3 className="font-heading text-base sm:text-xl font-normal text-white mb-1 sm:mb-2">{gs.name}</h3>
                        <p className="text-white/50 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">{gs.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-4">
                          {includedProducts.map((p) => (
                            <span key={p.id} className="text-[0.6rem] uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5 rounded-sm">{p.name}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-heading text-sm sm:text-lg">{formatEGP(gs.price)}</span>
                        </div>
                      </div>
                    </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : collectionProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg">{emptyMsg.line1}</p>
              {emptyMsg.line2 && (
                <p className="text-white/20 text-sm mt-2">{emptyMsg.line2}</p>
              )}
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 mt-8 text-white/70 hover:text-white font-heading text-sm tracking-wider uppercase transition-colors"
              >
                <HiArrowRight className="rotate-180" />
                Back to Collections
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {collectionProducts.map((product) => {
                const imgSrc = product.images?.[0] || '/images/product-placeholder.png';
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group block"
                    prefetch={true}
                  >
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-visible transition-all duration-500 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                      <div className="relative aspect-square overflow-hidden bg-transparent">
                        <Image
                          src={imgSrc}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {product.badge && (
                          <span className="absolute top-3 left-3 z-[2] bg-white text-[#09142E] text-xs font-heading font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-6">
                        <p className="text-xs uppercase tracking-widest text-white/70 mb-1">
                          {product.category}
                        </p>
                        <h3 className="font-heading text-base sm:text-xl font-normal text-white mb-1 sm:mb-2">
                          {product.name}
                        </h3>
                        <p className="text-white/50 text-xs sm:text-sm line-clamp-1 mb-2 sm:mb-4">
                          {product.notes}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            {product.salePrice ? (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-white font-heading text-sm sm:text-lg">
                                  {formatEGP(product.salePrice)}
                                </span>
                                <span className="text-white/30 line-through text-xs sm:text-sm">
                                  {formatEGP(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white font-heading text-sm sm:text-lg">
                                {formatEGP(product.price)}
                              </span>
                            )}
                          </div>
                          <span className="text-white/40 group-hover:text-white transition-colors text-sm sm:text-base">
                            <HiArrowRight />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
