'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import type { SiteSettings } from '@/types';
import { getOptimizedVideoUrl } from '@/lib/videoUtils';

export default function Hero() {
  const { dir } = useLocale();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  const loaded = settings !== null;
  const heroTitle       = settings?.heroTitle       ?? '';
  const heroSubtitle    = settings?.heroSubtitle    ?? '';
  const heroDescription = settings?.heroDescription ?? '';
  const videoUrl        = settings?.heroVideoUrl    ?? '';
  const bgImageMobile   = settings?.heroBgImage        ?? '';
  const bgImageDesktop  = settings?.heroBgImageDesktop ?? '';

  // Dev-only: log the exact URL sent to <video src> so you can verify
  // f_auto,q_auto:best and ?v=3 are present in DevTools → Network tab.
  if (process.env.NODE_ENV === 'development' && videoUrl) {
    console.log('[Hero] raw videoUrl from DB :', videoUrl);
    console.log('[Hero] optimized videoUrl   :', getOptimizedVideoUrl(videoUrl));
  }

  const hiddenTitle       = !heroTitle.trim()       || heroTitle.trim()       === 'HIDDEN';
  const hiddenSubtitle    = !heroSubtitle.trim()    || heroSubtitle.trim()    === 'HIDDEN';
  const hiddenDescription = !heroDescription.trim() || heroDescription.trim() === 'HIDDEN';
  const hasText = !hiddenTitle || !hiddenSubtitle || !hiddenDescription;

  return (
    /*
     * NATURAL IMAGE HEIGHT STRATEGY
     * ─────────────────────────────
     * The section carries NO explicit height on desktop. Instead, the
     * background image is rendered as a normal block element (w-full h-auto)
     * so the section expands to exactly the image's intrinsic height —
     * zero cropping, zero clipping, regardless of how tall the asset is.
     *
     * The dark overlay and text are positioned absolutely on top.
     *
     * VIDEO exception: video has no intrinsic layout height, so we keep a
     * viewport-relative min-height for that case only.
     */
    <section className="relative w-full bg-[#09142E] overflow-hidden">

      {/* ── VIDEO (viewport-height fallback) ── */}
      {loaded && videoUrl && (
        <div className="relative w-full min-h-[85svh] md:min-h-[80vh]">
          <video
            src={getOptimizedVideoUrl(videoUrl)}
            autoPlay loop muted playsInline preload="auto"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* ── DESKTOP landscape image (16:9 — natural width×height, no crop) ── */}
      {loaded && !videoUrl && bgImageDesktop && (
        <Image
          src={bgImageDesktop}
          alt="Hero banner — desktop"
          width={1920}
          height={1080}
          priority
          sizes="100vw"
          className="hidden md:block w-full h-auto"
          style={{ display: undefined }}
        />
      )}

      {/* ── MOBILE portrait image (natural height — entire bottle visible) ── */}
      {loaded && !videoUrl && bgImageMobile && (
        <Image
          src={bgImageMobile}
          alt="Hero banner"
          width={900}
          height={1200}
          priority
          sizes="100vw"
          className={
            bgImageDesktop
              ? 'block md:hidden w-full h-auto'  // portrait only on mobile when desktop image exists
              : 'block w-full h-auto'              // portrait on ALL viewports when no desktop image
          }
        />
      )}

      {/* ── Dark plate when no media is set yet ── */}
      {loaded && !videoUrl && !bgImageMobile && !bgImageDesktop && (
        <div className="w-full min-h-[85svh] md:min-h-[75vh]" />
      )}

      {/* ── Dark gradient overlays ── */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/55 via-transparent to-[#09142E]/70" />

      {/* ── Foreground text & CTA — bottom-aligned over the full image ── */}
      <div
        className="absolute inset-0 flex flex-col justify-end items-center pb-14 md:pb-16 lg:pb-20"
        dir={dir}
      >
        <div className="max-w-container mx-auto px-4 sm:px-16 text-white flex flex-col items-center text-center w-full">
          {!hiddenSubtitle && (
            <span
              className="font-heading text-xs sm:text-sm md:text-base uppercase tracking-[0.25em] text-white block mb-4 md:mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]"
              dangerouslySetInnerHTML={{ __html: heroSubtitle }}
            />
          )}

          {!hiddenTitle && (
            <h1
              className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.15] mb-4 md:mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.35)]"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />
          )}

          {!hiddenDescription && (
            <p
              className="font-body text-sm sm:text-base md:text-lg font-light max-w-md mb-6 md:mb-8 animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90"
              dangerouslySetInnerHTML={{ __html: heroDescription }}
            />
          )}

          <div className={`flex justify-center gap-6 animate-fade-up opacity-0 [animation-delay:0.8s] ${hasText ? 'mt-2 md:mt-4' : ''}`}>
            <Link
              href="/collections/all-fragrances"
              className="btn btn-primary rounded-full px-8 py-3 text-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5"
            >
              Shop All Fragrances
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
