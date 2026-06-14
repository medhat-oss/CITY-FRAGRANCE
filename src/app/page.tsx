import { Suspense } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BestSellers from '@/components/BestSellers';
import CollectionCategories from '@/components/CollectionCategories';
import Footer from '@/components/Footer';
import { ServicesSection } from '@/components/ServicesSection';
import prisma from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';
import type { SiteSettings, CollectionData } from '@/types';
import { getOptimizedVideoUrl, getOptimizedImageUrl } from '@/lib/videoUtils';

export const dynamic = 'force-dynamic';

// ─── Data Fetching Helpers ──────────────────────────────────────────────────

const DEFAULTS: SiteSettings = {
  heroTitle: 'Celebrate in Luxury & Scent',
  heroSubtitle: 'Eid Al Adha Special',
  heroDescription: 'Exclusive Eid collection — enjoy 20% off on all premium fragrances.',
  announcementText: 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
  heroBgImage: '/images/hero-banner.png',
  heroBgImageDesktop: '',
  heroVideoUrl: '',
  heroVideoMobile: '',
  moodTitle: 'The Essence of Luxury & Elegance',
  moodSubtitle: 'Discover timeless scents crafted for those who appreciate the finer things in life.',
  moodImage: '/images/hero-banner.png',
  moodImageDesktop: '',
  moodVideoUrl: '',
  moodVideoMobile: '',
  womenCollectionVideoUrl: '',
  menCollectionVideoUrl: '',
  giftSetsVideoUrl: '',
  newArrivalsVideoUrl: '',
  allFragrancesVideoUrl: '',
  oudCollectionVideoUrl: '',
};

const SLUG_TO_VIDEO_FIELD: Record<string, string> = {
  'womens-collection': 'womenCollectionVideoUrl',
  'mens-collection': 'menCollectionVideoUrl',
  'gift-sets': 'giftSetsVideoUrl',
  'new-arrivals': 'newArrivalsVideoUrl',
  'all-fragrances': 'allFragrancesVideoUrl',
  'oud-collection': 'oudCollectionVideoUrl',
};

async function getSettings(): Promise<SiteSettings> {
  let dbSettings = null;
  try {
    dbSettings = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
  } catch {}
  
  const savedJson = await readJsonFile<Partial<SiteSettings>>('site-settings.json', {});
  return { ...DEFAULTS, ...savedJson, ...(dbSettings || {}) } as SiteSettings;
}

// ─── Skeletons ─────────────────────────────────────────────────────────────

function HeroFallback() {
  return (
    <section className="relative w-full bg-[#09142E] overflow-hidden">
      <div className="w-full aspect-[4/5] md:aspect-[21/9] bg-zinc-900/50 animate-pulse" />
    </section>
  );
}

function BestSellersFallback() {
  return (
    <section className="py-16 px-4 sm:px-8 bg-white dark:bg-[#09142E]">
      <div className="max-w-container mx-auto">
        <div className="h-10 w-48 bg-zinc-800/50 animate-pulse rounded mb-12" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-zinc-800/50 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionsFallback() {
  return (
    <section className="pt-4 pb-16 px-4 sm:px-8 bg-slate-50 dark:bg-[#09142E] border-b dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="aspect-square bg-slate-800/50 animate-pulse rounded-2xl w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Async Server Components ───────────────────────────────────────────────

async function HeroServer() {
  const settings = await getSettings();
  return <Hero settings={settings} />;
}

async function CollectionCategoriesServer() {
  const settings = await getSettings();
  const images = await readJsonFile<Record<string, CollectionData>>('collection-images.json', {});
  
  for (const [slug, settingsKey] of Object.entries(SLUG_TO_VIDEO_FIELD)) {
    if (!images[slug]) images[slug] = { image: '', description: '' };
    images[slug].videoUrl = (settings as any)[settingsKey] || '';
  }

  return <CollectionCategories collectionData={images} />;
}

async function BestSellersServer() {
  const products = await prisma.product.findMany({
    where: { isDraft: { not: true } },
    orderBy: { createdAt: 'desc' }
  });

  const bestSellers = products
    .filter((p) => p.badge && (p.badge.toUpperCase().includes('BEST SELLER') || p.badge.toUpperCase().includes('SALE')))
    .slice(0, 4);

  return <BestSellers title="Best Sellers" products={bestSellers as any} />;
}

async function MoodSectionServer() {
  const settings = await getSettings();

  const moodTitle = settings.moodTitle;
  const moodSubtitle = settings.moodSubtitle;
  const isMoodTitleHidden = !moodTitle || moodTitle === 'HIDDEN' || moodTitle.trim() === '';
  const isMoodSubtitleHidden = !moodSubtitle || moodSubtitle === 'HIDDEN' || moodSubtitle.trim() === '';
  const showMoodBadge = !isMoodTitleHidden || !isMoodSubtitleHidden;
  const hasVideo = settings.moodVideoUrl || settings.moodVideoMobile;
  const hasImage = settings.moodImage || settings.moodImageDesktop;

  return (
    <section className="relative w-full bg-[#09142E] overflow-hidden mb-24 transform-gpu backface-hidden translate-z-0">
      {hasVideo ? (
        <>
          <video key="mood-video-mobile" src={getOptimizedVideoUrl(settings.moodVideoMobile || settings.moodVideoUrl)} autoPlay loop muted playsInline preload="metadata" className="w-full h-auto block md:hidden" />
          <video key="mood-video-desktop" src={getOptimizedVideoUrl(settings.moodVideoUrl || settings.moodVideoMobile)} autoPlay loop muted playsInline preload="metadata" className="w-full h-auto hidden md:block" />
        </>
      ) : hasImage ? (
        <>
          <Image src={getOptimizedImageUrl(settings.moodImage || settings.moodImageDesktop)} alt="Luxury fragrance ambiance" width={900} height={1200} loading="lazy" style={{ width: '100%', height: 'auto' }} className="block md:hidden" />
          <Image src={getOptimizedImageUrl(settings.moodImageDesktop || settings.moodImage)} alt="Luxury fragrance ambiance" width={1920} height={1080} loading="lazy" style={{ width: '100%', height: 'auto' }} className="hidden md:block" />
        </>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/30">
        <div className="space-y-4 max-w-2xl">
          {showMoodBadge && <span className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-white block mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]">City Fragrance</span>}
          {!isMoodTitleHidden && <h2 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.2)]">{moodTitle}</h2>}
          {!isMoodSubtitleHidden && <p className="font-body text-base sm:text-lg font-light max-w-md animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90">{moodSubtitle}</p>}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page Shell ───────────────────────────────────────────────────────

export default async function Homepage() {
  return (
    <div className="bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />
      <main>
        <Suspense fallback={<HeroFallback />}>
          <HeroServer />
        </Suspense>
        
        <Suspense fallback={<CollectionsFallback />}>
          <CollectionCategoriesServer />
        </Suspense>
        
        <Suspense fallback={<BestSellersFallback />}>
          <BestSellersServer />
        </Suspense>
        
        <Suspense fallback={<HeroFallback />}>
          <MoodSectionServer />
        </Suspense>
        
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
