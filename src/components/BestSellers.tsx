'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
  title?: string;
}

export default function BestSellers({ products, title = 'Best Sellers' }: BestSellersProps) {
  const { dir } = useLocale();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="py-16 px-4 sm:px-8 bg-white dark:bg-[#09142E]" dir={dir}>
      <div className="max-w-container mx-auto">
        {/* Section Header */}
          <div className="flex justify-between items-end mb-8 border-b border-navy/10 dark:border-slate-800 pb-2">
          <h2 className="font-heading text-3xl sm:text-4xl font-normal text-navy dark:text-white">
            {title}
          </h2>
          <Link
            href="/collections/all"
            prefetch="auto"
            className="font-heading text-xs uppercase tracking-[0.1em] text-navy dark:text-slate-300 font-medium relative pb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-white after:transition-transform after:duration-300 hover:after:scale-x-0 hover:after:origin-left"
          >
            View All
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {products.slice(0, 4).map((product) => {
            const mainImage = imgErrors[product.id]
              ? '/placeholder.png'
              : product.images?.[0] || '/images/product-placeholder.png';
            const isSale = product.badge?.toUpperCase().includes('SALE');
            const badgeLabel =
              product.badge?.toUpperCase().includes('EID')
                ? product.badge
                : isSale
                  ? 'EID SALE'
                  : product.badge;

            return (
              <div key={product.id} className="flex flex-col transition-all duration-700 ease-out hover:scale-[1.03]">
                {/* Image Wrapper — perfect aspect-square, no padding gaps */}
                <Link
                  href={`/product/${product.id}`}
                  prefetch="auto"
                  className="relative aspect-square overflow-hidden bg-transparent block"
                >
                  {/* Badge */}
                  {badgeLabel && (
                    <span
                      className={`absolute top-3 left-3 z-[2] font-heading text-[0.65rem] font-semibold tracking-[0.1em] px-3 py-1 uppercase rounded-sm ${
                        isSale
                          ? 'bg-sale text-white'
                          : 'bg-navy text-white'
                      }`}
                    >
                      {badgeLabel}
                    </span>
                  )}

                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    onError={() => handleImgError(product.id)}
                  />

                  {/* Quick View Overlay */}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full opacity-0 w-[85%] py-3 bg-white/95 text-navy font-heading text-xs font-semibold uppercase tracking-[0.1em] text-center cursor-pointer transition-all duration-300 z-[2] rounded-sm hover:bg-navy hover:text-white group-hover:translate-y-0 group-hover:opacity-100">
                    Quick View
                  </span>
                </Link>

                {/* Product Info */}
                <div className="text-center mt-4">
                  <Link href={`/product/${product.id}`} prefetch="auto">
                    <h3 className="font-heading text-lg sm:text-xl font-normal text-navy dark:text-white mb-1">
                      {product.name}
                    </h3>
                  </Link>
                  {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).length > 0 && (
                    <p className="font-body text-sm text-ink-lighter italic mb-3">
                      {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  <div className="flex justify-center items-center gap-3 font-heading">
                    {product.salePrice ? (
                      <>
                        <span className="font-semibold text-sale text-base">
                          {formatEGP(product.salePrice)}
                        </span>
                        <span className="text-ink-lighter line-through text-sm">
                          {formatEGP(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-navy dark:text-white text-base">
                        {formatEGP(product.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
