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
import { getOptimizedVideoUrl } from '@/lib/videoUtils';

export default function Home() {
  const { isLoaded, getBestSellers } = useProducts();
  const [moodSettings, setMoodSettings] = useState({
    moodTitle: '', moodSubtitle: '',
    moodImage: '', moodImageDesktop: '', moodVideoUrl: '',
  });
  const [moodLoaded, setMoodLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setMoodSettings({
          moodTitle:         data.moodTitle,
          moodSubtitle:      data.moodSubtitle,
          moodImage:         data.moodImage,
          moodImageDesktop:  data.moodImageDesktop,
          moodVideoUrl:      data.moodVideoUrl,
        });
        setMoodLoaded(true);
      })
      .catch(() => setMoodLoaded(true));
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
        {/*
         * Natural Image Height Strategy — mirrors Hero.tsx:
         * The image drives the section height (w-full h-auto block).
         * Overlay and text sit absolutely on top. Zero clipping.
         */}
        <section className="relative w-full bg-[#09142E] overflow-hidden">

          {/* VIDEO — needs viewport height since video has no intrinsic layout flow */}
          {moodLoaded && moodSettings.moodVideoUrl && (
            <div className="relative w-full min-h-[85svh] md:min-h-[80vh]">
              <video
                src={getOptimizedVideoUrl(moodSettings.moodVideoUrl)}
                autoPlay loop muted playsInline preload="auto"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
          )}

          {/* Desktop landscape image (natural 16:9 height) */}
          {moodLoaded && !moodSettings.moodVideoUrl && moodSettings.moodImageDesktop && (
            <Image
              src={moodSettings.moodImageDesktop}
              alt="Luxury fragrance ambiance — desktop"
              width={1920}
              height={1080}
              priority
              sizes="100vw"
              className="hidden md:block w-full h-auto"
            />
          )}

          {/* Portrait image — natural full height, no crop */}
          {moodLoaded && !moodSettings.moodVideoUrl && moodSettings.moodImage && (
            <Image
              src={moodSettings.moodImage}
              alt="Luxury fragrance ambiance"
              width={900}
              height={1200}
              priority
              sizes="100vw"
              className={
                moodSettings.moodImageDesktop
                  ? 'block md:hidden w-full h-auto'
                  : 'block w-full h-auto'
              }
            />
          )}

          {/* Dark plate when no media */}
          {moodLoaded && !moodSettings.moodVideoUrl && !moodSettings.moodImage && !moodSettings.moodImageDesktop && (
            <div className="w-full min-h-[85svh] md:min-h-[75vh]" />
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/55 via-transparent to-[#09142E]/70" />

          {/* Text — centered absolutely over the full image */}
          <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-container mx-auto px-4 sm:px-16 text-white flex flex-col items-center text-center w-full py-16 md:py-20">
            {(() => {
              const title = moodSettings.moodTitle;
              const subtitle = moodSettings.moodSubtitle;
              const isTitleHidden = !title || title === 'HIDDEN' || title.trim() === '';
              const isSubtitleHidden = !subtitle || subtitle === 'HIDDEN' || subtitle.trim() === '';
              const showBadge = !isTitleHidden || !isSubtitleHidden;
              return (
                <>
                  {showBadge && (
                    <span className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-white block mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]">
                      City Fragrance
                    </span>
                  )}
                  {!isTitleHidden && (
                    <h2 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
                      {title}
                    </h2>
                  )}
                  {!isSubtitleHidden && (
                    <p className="font-body text-base sm:text-lg font-light max-w-md animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90">
                      {subtitle}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          </div>
        </section>

        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
