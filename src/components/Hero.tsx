'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import type { SiteSettings } from '@/types';

export default function Hero() {
  const { dir } = useLocale();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { next: { revalidate: 60 } })
      .then((res) => res.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  const title = settings?.heroTitle || 'Celebrate in Luxury & Scent';
  const subtitle = settings?.heroSubtitle || 'Eid Al Adha Special';
  const bgImage = settings?.heroBgImage || '/images/hero-banner.png';

  return (
    <section className="relative h-[calc(100vh-120px)] min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-[1]">
        <Image
          src={bgImage}
          alt="Hero banner"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/45 via-transparent to-[#09142E]/60" />
      </div>

      <div
        className="relative z-[2] max-w-container mx-auto px-4 sm:px-16 text-white flex flex-col items-center text-center w-full"
        dir={dir}
      >
        <span
          className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-white block mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />

        <h1
          className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
          dangerouslySetInnerHTML={{ __html: title }}
        />

        <p className="font-body text-base sm:text-lg font-light max-w-md mb-8 animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90">
          Exclusive Eid collection — enjoy{' '}
          <strong className="text-white font-semibold">20% off</strong> on all
          premium fragrances.
        </p>

        <div className="flex justify-center gap-6 mt-12 animate-fade-up opacity-0 [animation-delay:0.8s]">
          <Link href="/collections/all-fragrances" className="btn btn-primary rounded-full px-8 py-3 text-sm shadow-[0_8px_25px_rgba(197,160,89,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(197,160,89,0.45)]">
            Shop All Fragrances
          </Link>
        </div>
      </div>
    </section>
  );
}
