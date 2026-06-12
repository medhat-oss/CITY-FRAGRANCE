'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import { HiArrowRight } from 'react-icons/hi2';
import type { CollectionData } from '@/types';
import { dedupFetch } from '@/lib/dedupFetch';
import { fetchCachedSettings } from '@/lib/settingsCache';

const COLLECTION_TITLES: Record<string, string> = {
  'new-arrivals': 'NEW ARRIVALS',
  'all-fragrances': 'ALL FRAGRANCES',
  'oud-collection': 'OUD COLLECTION',
  'mens-collection': "MEN'S COLLECTION",
  'womens-collection': "WOMEN'S COLLECTION",
  'gift-sets': 'GIFT SETS',
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

const COLLECTION_VIDEO_KEYS: Record<string, string> = {
  'womens-collection': 'womenCollectionVideoUrl',
  'mens-collection': 'menCollectionVideoUrl',
  'gift-sets': 'giftSetsVideoUrl',
  'new-arrivals': 'newArrivalsVideoUrl',
  'all-fragrances': 'allFragrancesVideoUrl',
  'oud-collection': 'oudCollectionVideoUrl',
};

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getProductsByCollection, products } = useProducts();
  const [giftSets, setGiftSets] = useState<GiftSet[]>([]);
  const [collectionInfo, setCollectionInfo] = useState<{ image: string; description: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    if (slug === 'gift-sets') {
      fetch('/api/gift-sets').then((r) => r.json()).then((d) => setGiftSets(d.giftSets || [])).catch(() => {});
    }
    dedupFetch<{ images: Record<string, CollectionData> }>('/api/collections').then((d) => {
      const entry = d.images?.[slug];
      if (entry) setCollectionInfo({ image: entry.image, description: entry.description });
    }).catch(() => {});

    // Fetch site settings to retrieve collection specific videos
    fetchCachedSettings<any>().then((d) => {
      const videoKey = COLLECTION_VIDEO_KEYS[slug];
      if (videoKey && d[videoKey]) {
        setVideoUrl(d[videoKey]);
      }
    }).catch(() => {});
  }, [slug]);

  const meta = { title: COLLECTION_TITLES[slug] || slug, description: collectionInfo?.description || '' };
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
        {/* Luxury Header Text Section */}
        <section className="pt-36 pb-16 text-center px-6 max-w-4xl mx-auto relative z-10">
          <p className="text-white/40 font-heading text-xs tracking-[0.45em] uppercase mb-4">
            City Fragrance
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-2 tracking-wide uppercase">
            {meta.title}
          </h1>
          <div className="w-12 h-[2px] bg-white/20 mx-auto my-5" />
          {meta.description && (
            <p className="text-white/60 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-light">
              {meta.description}
            </p>
          )}
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
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden transition-all duration-700 ease-out hover:scale-[1.03] hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                        <div className="relative aspect-square overflow-hidden bg-transparent">
                          <Image src={gs.image || '/images/product-placeholder.png'} alt={gs.name} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
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
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden transition-all duration-700 ease-out hover:scale-[1.03] hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                      <div className="relative aspect-square overflow-hidden bg-transparent">
                        <Image
                          src={imgSrc}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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
                          {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}
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
