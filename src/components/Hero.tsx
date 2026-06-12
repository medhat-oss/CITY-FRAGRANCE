'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import type { SiteSettings } from '@/types';
import { getOptimizedImageUrl, getOptimizedVideoUrl } from '@/lib/videoUtils';

interface HeroProps {
  settings: SiteSettings | null;
}

export default function Hero({ settings }: HeroProps) {
  const { dir } = useLocale();

  if (!settings) {
    return (
      <section className="relative w-full bg-[#09142E] overflow-hidden transform-gpu backface-hidden translate-z-0">
        <div className="w-full aspect-[4/5] md:aspect-[21/9] bg-zinc-900/50 animate-pulse" />
      </section>
    );
  }

  const heroTitle = settings.heroTitle ?? '';
  const heroSubtitle = settings.heroSubtitle ?? '';
  const heroDescription = settings.heroDescription ?? '';
  const imageDesktop = settings.heroBgImageDesktop ?? '';
  const imageMobile = settings.heroBgImage ?? '';

  const hiddenTitle = !heroTitle.trim() || heroTitle.trim() === 'HIDDEN';
  const hiddenSubtitle = !heroSubtitle.trim() || heroSubtitle.trim() === 'HIDDEN';
  const hiddenDescription = !heroDescription.trim() || heroDescription.trim() === 'HIDDEN';
  const hasImage = imageDesktop || imageMobile;
  const heroVideoUrl = settings.heroVideoUrl ?? '';
  const heroVideoMobile = settings.heroVideoMobile ?? '';
  const hasVideo = heroVideoUrl || heroVideoMobile;

  return (
    <section className="relative w-full bg-[#09142E] overflow-hidden transform-gpu backface-hidden translate-z-0">

      {/* Mobile Video */}
      {hasVideo && (
        <video
          key="hero-video-mobile"
          src={getOptimizedVideoUrl(heroVideoMobile || heroVideoUrl)}
          autoPlay loop muted playsInline preload="metadata"
          className="w-full h-auto block md:hidden"
        />
      )}

      {/* Desktop Video */}
      {hasVideo && (
        <video
          key="hero-video-desktop"
          src={getOptimizedVideoUrl(heroVideoUrl || heroVideoMobile)}
          autoPlay loop muted playsInline preload="metadata"
          className="w-full h-auto hidden md:block"
        />
      )}

      {/* Mobile Image */}
      {!hasVideo && hasImage && (
        <Image
          src={getOptimizedImageUrl(imageMobile || imageDesktop)}
          alt="Hero banner"
          width={900}
          height={1200}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ width: '100%', height: 'auto' }}
          className="block md:hidden"
        />
      )}

      {/* Desktop Image */}
      {!hasVideo && hasImage && (
        <Image
          src={getOptimizedImageUrl(imageDesktop || imageMobile)}
          alt="Hero banner"
          width={1920}
          height={1080}
          priority
          sizes="(max-width: 1200px) 100vw, 1920px"
          style={{ width: '100%', height: 'auto' }}
          className="hidden md:block"
        />
      )}

      {/* Overlay + Foreground Content */}
      <div className="absolute inset-0 bg-black/40 flex flex-col justify-between items-center py-16 md:py-24 text-center px-4 z-10" dir={dir}>

        {/* Top Spacer */}
        <div className="h-0 w-0 invisible" />

        {/* Middle Content — perfectly centered */}
        <div className="text-center space-y-4 px-6 max-w-3xl flex flex-col items-center justify-center flex-1">
          {!hiddenSubtitle && (
            <span
              className="font-heading text-xs sm:text-sm md:text-base uppercase tracking-[0.25em] text-white block animate-fade-up opacity-0 [animation-delay:0.2s]"
              dangerouslySetInnerHTML={{ __html: heroSubtitle }}
            />
          )}
          {!hiddenTitle && (
            <h1
              className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.15] animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.35)]"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />
          )}
          {!hiddenDescription && (
            <p
              className="font-body text-sm sm:text-base md:text-lg font-light max-w-md animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90"
              dangerouslySetInnerHTML={{ __html: heroDescription }}
            />
          )}
        </div>

        {/* Bottom Content — button locked at the bottom */}
        <div className="w-full flex justify-center mt-auto">
          <Link
            href="/collections/all-fragrances"
            className="bg-white text-black px-8 py-4 text-sm font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-neutral-200 transition-[transform,opacity] duration-300 hover:scale-105 shadow-lg"
          >
            Shop All Fragrances
          </Link>
        </div>
      </div>
    </section>
  );
}
