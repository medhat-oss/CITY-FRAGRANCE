'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BestSellers from '@/components/BestSellers';
import CollectionCategories from '@/components/CollectionCategories';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { ServicesSection } from '@/components/ServicesSection';
import type { SiteSettings } from '@/types';

export default function Home() {
  const { isLoaded, getBestSellers } = useProducts();
  const [moodSettings, setMoodSettings] = useState({ moodTitle: '', moodSubtitle: '', moodImage: '' });

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: SiteSettings) => setMoodSettings({ moodTitle: data.moodTitle, moodSubtitle: data.moodSubtitle, moodImage: data.moodImage }))
      .catch(() => {});
  }, []);

  if (!isLoaded) return null;

  const bestSellers = getBestSellers();

  return (
    <div className="bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />
      <main>
        <Hero />
        <CollectionCategories />
        <BestSellers title="Best Sellers" products={bestSellers} />

        {/* ─── Mood / CTA Section ─── */}
        <section className="relative h-[calc(100vh-120px)] min-h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-[1]">
            <Image
              src={moodSettings.moodImage || '/images/hero-banner.png'}
              alt="Luxury fragrance ambiance"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/45 via-transparent to-[#09142E]/60" />
          </div>

          <div className="relative z-[2] max-w-container mx-auto px-4 sm:px-16 text-white flex flex-col items-center text-center w-full">
            <span className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-white block mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]">
              City Fragrance
            </span>

            <h2 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
              {moodSettings.moodTitle || 'The Essence of Luxury &amp; Elegance'}
            </h2>

            <p className="font-body text-base sm:text-lg font-light max-w-md animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90">
              {moodSettings.moodSubtitle || 'Discover timeless scents crafted for those who appreciate the finer things in life.'}
            </p>
          </div>
        </section>

        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
